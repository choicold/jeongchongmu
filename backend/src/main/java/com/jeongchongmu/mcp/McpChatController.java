package com.jeongchongmu.mcp;

import com.jeongchongmu.domain.OCR.service.FileStorageService;
import com.jeongchongmu.mcp.tools.*;
import com.jeongchongmu.user.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/mcp")
public class McpChatController {

    private static final String SYSTEM_PROMPT = """
            당신은 꼼꼼하고 센스 있는 정산 관리자 '정총무'입니다.
            사용자는 친구들과의 즐거운 모임을 위해 당신을 고용했습니다.
            딱딱한 기계처럼 굴지 말고, **친근하고 명확하게** 대화하십시오.

            하지만 돈 문제는 철저해야 합니다. 반드시 아래의 [업무 수칙]을 순서대로 지켜야 합니다.

            ### [1. 정총무의 사고 과정 (Step-by-Step Logic)]
            사용자의 요청이 들어오면 **절대 추측하여 실행하지 말고**, 다음 단계에 따라 사고하십시오.

            **단계 1: 이미지(영수증) 상세 분석 및 확인 (First Turn)**
            - 상황: 사용자가 이미지만 업로드하고 그룹을 말하지 않음.
            - **행동:**
              1. 무조건 `analyzeReceipt` (OCR)를 먼저 실행하십시오.
              2. **🛑 실행을 멈추고 사용자에게 확인을 받으십시오.**
              3. **필수 출력:** 사용자가 안심할 수 있도록 **분석된 모든 내역(상호명, 날짜, 세부 품목 및 가격)**을 리스트 형태로 자세히 보여주십시오.
              4. **필수 질문:** "총 금액 OOO원이네요! **어느 그룹에 올릴까요?** (그룹만 말씀하시면 **참여자는 전원**, **태그는 자동**으로 설정해서 지출을 등록해 드립니다!)"
              5. 절대 이 단계에서 지출을 저장하지 마십시오.

            **단계 2: 그룹 식별 (Context Identification)**
            - 상황: 사용자가 그룹 이름(예: "소마")을 말함. (이전 턴의 영수증 정보 기억)
            - **행동:**
              1. `getMyGroups`를 실행해 그룹 ID를 찾으십시오.
              2. (참여자는 '전원'이 디폴트이므로, 별도 멤버 조회 없이 지출 생성 단계로 넘어갑니다.)

            **단계 3: 지출 생성 (Expense Creation ONLY)**
            - **행동:**
              1. OCR 정보와 그룹 ID를 사용하여 `createExpense`를 실행하십시오.
              2. **태그(Tags):** 사용자가 별말 없으면 지출 내용(식당, 카페, 마트 등)에 맞춰 **당신이 가장 적절한 태그를 자동으로 입력**하십시오. (예: '식비', '회식', '장보기' 등)
              3. **참여자:** 시스템 기본값(전원)으로 처리합니다.
              4. **🛑 중요:** 지출만 생성하고, **절대 `createNBunSettlement`(정산)를 이어서 실행하지 마십시오.**

            **단계 4: 완료 보고 및 정산 제안 (Report & Ask)**
            - 지출 생성이 성공하면 다음과 같이 답변하십시오.
            - **형식:**
              "✅ **[그룹명]**에 지출 등록을 완료했습니다!
               - **내용:** [지출 제목] (총 [금액]원)
               - **태그:** [자동 설정된 태그] (자동)
               - **참여자:** 그룹 전원 (기본값)
               
               💰 **바로 정산(N빵)을 진행할까요?** 아니면 투표를 만드실래요?"

            ### [★OCR 데이터 처리 규칙 (Price Logic)]
            1. 우리 시스템은 **`단가(Unit Price) * 수량(Quantity) = 합계`** 로직을 따릅니다.
            2. OCR 결과의 `price`가 수량과 곱했을 때 총액을 초과한다면, 이는 '합계'이므로 **수량으로 나누어 '단가'로 변환**해 입력하십시오.

            ### [★핵심: ID 사용 절대 원칙 (ID Integrity Protocol)]
            1. **경고:** 프롬프트 예시에 있는 ID(101, 99 등)는 단순 예시일 뿐입니다. **절대 실제 호출에 사용하지 마십시오.**
            2. **행동:** 반드시 `getMyGroups`나 `getExpensesByGroup`으로 조회된 **결과값(Real ID)**만 사용하십시오.
            3. 만약 ID를 모른다면, **추측하지 말고** 반드시 조회 도구를 먼저 실행하십시오.
            
            ### [★핵심: 목록 선택 및 범위 제한 프로토콜]
            1. 사용자가 "1번"이라고 하면 화면상 1번에 해당하는 실제 ID를 사용하십시오.
            2. "전부 정산해줘"는 화면에 보이는 목록에만 적용하십시오.

            ### [2. 절대 금지 사항]
            1. 사용자가 그룹을 말하기 전에는 절대 `createExpense`를 하지 마십시오.
            2. 사용자가 요청하지 않았는데 `createNBunSettlement` 등 **정산 도구를 자동으로 실행하지 마십시오.** (지출 등록까지만 수행)
            3. 삭제 시에는 반드시 재확인을 받으십시오.
            
            이제 위 수칙을 바탕으로 사용자의 요청을 처리하십시오.
            """;

    private final ChatClient chatClient;
    private final ExpenseAiTools expenseAiTools;
    private final GroupAiTools groupAiTools;
    private final OcrAiTools ocrAiTools;
    private final FileStorageService fileStorageService;
    private final StatisticsAiTools statisticsAiTools;
    private final DateTimeAiTools dateTimeAiTools;
    private final VoteAiTools voteAiTools;
    private final SettlementAiTools settlementAiTools;

    public McpChatController(
            ChatClient.Builder builder,
            ChatMemory chatMemory,
            ExpenseAiTools expenseAiTools,
            GroupAiTools groupAiTools,
            OcrAiTools ocrAiTools,
            FileStorageService fileStorageService,
            StatisticsAiTools statisticsAiTools,
            DateTimeAiTools dateTimeAiTools,
            VoteAiTools voteAiTools,
            SettlementAiTools settlementAiTools
    ) {
        this.expenseAiTools = expenseAiTools;
        this.groupAiTools = groupAiTools;
        this.ocrAiTools = ocrAiTools;
        this.fileStorageService = fileStorageService;
        this.statisticsAiTools = statisticsAiTools;
        this.dateTimeAiTools = dateTimeAiTools;
        this.voteAiTools = voteAiTools;
        this.settlementAiTools = settlementAiTools;

        this.chatClient = builder
                .defaultOptions(OpenAiChatOptions.builder()
                        .model("gpt-4o")
                        .temperature(0.5)
                        .build())
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .build();
    }

    @PostMapping(value = "/chat", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public String chatWithFiles(
            @RequestParam("message") String message,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return "로그인이 필요합니다.";

        // 간단한 상태 로깅만 남김
        int fileCount = (files != null) ? files.size() : 0;
        log.info("Chat Request - User: {}, Files: {}, Message: {}", user.getId(), fileCount, message);

        StringBuilder userMessageContent = new StringBuilder(message);

        // 파일 처리 로직
        if (files != null && !files.isEmpty()) {
            if (files.size() > 5) {
                return "이미지는 한 번에 최대 5장까지만 업로드할 수 있습니다.";
            }

            userMessageContent.append("\n[시스템 첨부: 사용자가 다음 이미지들을 업로드했습니다]");

            try {
                int count = 1;
                for (MultipartFile file : files) {
                    if (!file.isEmpty()) {
                        // Supabase 업로드
                        String imageUrl = fileStorageService.saveFile(file);
                        // 프롬프트에 URL 추가
                        userMessageContent.append(String.format("\n(%d) URL: %s", count++, imageUrl));
                    }
                }
            } catch (IOException e) {
                log.error("File Upload Error", e);
                return "이미지 업로드 중 오류가 발생했습니다: " + e.getMessage();
            }
        }

        // AI 호출
        Map<String, Object> contextMap = Map.of("currentUserId", user.getId());

        List<Message> messages = List.of(
                new SystemMessage(SYSTEM_PROMPT),
                new UserMessage(userMessageContent.toString())
        );

        return chatClient.prompt()
                .messages(messages)
                .toolContext(contextMap)
                .tools(expenseAiTools, groupAiTools, ocrAiTools,statisticsAiTools,dateTimeAiTools, voteAiTools, settlementAiTools)
                .call()
                .content();
    }
}