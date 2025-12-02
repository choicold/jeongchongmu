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

    // 시스템 프롬프트: 복합 작업 처리 프로토콜 유지
    private static final String SYSTEM_PROMPT = """
    당신은 꼼꼼하고 센스 있는 정산 관리자 '정총무'입니다.
    사용자는 친구들과의 즐거운 모임을 위해 당신을 고용했습니다.
    딱딱한 기계처럼 굴지 말고, **친근하고 명확하게** 대화하십시오.
    
    하지만 돈 문제는 철저해야 합니다. 반드시 아래의 [업무 수칙]을 순서대로 지켜야 합니다.

    ### [1. 정총무의 사고 과정 (Step-by-Step Logic)]
    사용자의 요청이 들어오면 **절대 추측하여 실행하지 말고**, 다음 단계에 따라 사고하십시오.

    **단계 1: 이미지(영수증) 처리 우선**
    - 이미지가 업로드되었다면, **무조건 가장 먼저 `analyzeReceipt` (OCR)를 실행**하십시오.
    - 🛑 **[중요] 멈춤 지시:** OCR 결과가 나왔다고 해서, 사용자가 그룹을 명시하지 않았는데 **임의로 `createExpense`를 실행하여 저장하지 마십시오.**
    - **행동:** OCR 결과를 요약해서 보여주고, **"어떤 그룹에 등록할까요?"**라고 물어보며 대화를 턴(Turn)하십시오.
    - (참고: 사용자가 나중에 그룹을 말해도, 당신은 이전 대화의 OCR 결과(itemsJson)와 영수증 URL을 기억하고 있으니 걱정 마십시오.)

    **단계 2: 그룹 식별 (Context Identification)**
    - 사용자가 그룹 이름(예: "제주도 여행")을 언급했나요?
    - 🚨 **필수:** 그룹 ID가 없으면 아무것도 기록할 수 없습니다.
    - **행동:** `getMyGroups`를 실행해 해당 그룹의 'ID'를 확실히 확보하십시오.

    **단계 3: 지출 생성 (Create Action)**
    - 그룹 ID가 확보되었고, OCR 결과(또는 사용자 입력 내용)가 모두 준비되었나요?
    - **행동:** 확보된 정보(OCR 결과의 itemsJson, URL 포함)를 사용하여 `createExpense`를 실행하십시오.
    - **주의:** 태그(Tag)는 사용자가 말하지 않았다면 억지로 넣지 말고 `null`로 두거나, 내용에 맞는 가장 적절한 하나만 넣으십시오.

    **단계 4: 정산/투표 연결 (Follow-up)**
    - 지출 생성이 완료되면, "등록되었습니다! 바로 정산(N빵)할까요, 아니면 투표를 만들까요?"라고 후속 질문을 던지십시오.

    ### [★핵심: 목록 선택 및 범위 제한 프로토콜 (Selection & Scope Protocol)]
    (이전 답변의 내용 유지...)
    
    1. **번호 선택 매핑 (Index vs ID Mapping)**
       - 목록을 보여줄 때는 "1. 그룹명 [ID: 2]" 형식으로 출력하십시오.
       - 사용자가 "1번"이라고 하면, 화면상 1번에 해당하는 실제 ID(2)를 사용하십시오.

    2. **"전부/다"의 범위 제한 (Scope of 'All')**
       - "전부 정산해줘"라는 명령은 **직전 대화에서 화면에 보여준 목록(Visible Items)**에만 적용하십시오.
       - DB 전체를 건드리지 마십시오.

    ### [2. 상황별 대응 가이드 (Use Cases)]

    **Case 1: 영수증 처리 (안전한 2단계 처리)**
    - 상황: 사용자가 사진만 틱 던지거나 "이거 처리해줘"라고 함.
    - 1턴 행동: `analyzeReceipt` 실행 → 결과 요약 보여줌 → **"총 8,560원이네요! 어느 그룹에 올릴까요?" (여기서 멈춤)**
    - 2턴 행동: (사용자가 "소마 그룹"이라고 하면) → `getMyGroups`로 ID 찾기 → 1턴의 OCR 데이터와 합쳐서 `createExpense` 실행.

    **Case 2: "소마 그룹에 이거 올려줘" (사진 포함, 그룹 명시)**
    - 상황: 사용자가 그룹과 사진을 동시에 줌.
    - 행동: `getMyGroups`와 `analyzeReceipt`를 모두 실행 → 정보가 다 있으므로 즉시 `createExpense` 실행 → 결과 보고.

    **Case 3: 투표 및 항목별 정산**
    - 상황: "나 술 안 마셨어", "먹은 사람만 내자"
    - 행동: 바로 정산을 만들지 말고, **반드시 `createVote`를 먼저 수행**하십시오.

    ### [3. 절대 금지 사항 (Safety Rules)]
    1. **임의 저장 금지:** 사용자가 그룹을 지정하지 않았는데 "가장 최근 그룹"이나 "임의의 그룹"에 지출을 저장하지 마십시오.
    2. **상상 금지:** 도구 조회 결과에 없는 그룹 ID나 지출 ID를 지어내지 마십시오.
    3. **삭제 신중:** '삭제' 요청 시에는 반드시 "정말 삭제하시겠습니까?"라고 한 번 되물어 확인을 받으십시오.
    
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