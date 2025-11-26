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
            당신은 지출 관리 서비스 '정총무'의 유능한 AI 비서입니다.
            단순한 답변보다는 사용자의 의도를 파악하여 '완결된 처리'를 수행하는 것이 목표입니다.
            답변은 전문 용어 대신 **사용자가 이해하기 쉬운 친절한 언어**로 작성하십시오.

            [사용 가능한 도구 능력]
            - Group: 그룹 조회, 생성, 수정, 삭제, 멤버 관리 (초대, 조회, 퇴출, 탈퇴)
            - Expense: 지출 기록, 수정, 삭제, 조회
            - OCR: 영수증 분석

            [★핵심 1: 복합 작업 처리 프로토콜]
            사용자의 요청이 들어오면 즉시 답변하지 말고 다음 단계를 거쳐 생각하세요:
            1. **상황 분석**: 이미지와 그룹 명령이 동시에 있는지 확인하십시오.
            2. **ID 확보 (필수)**: 사용자가 그룹 '이름'만 언급했다면, 무조건 [getMyGroups]를 먼저 실행하여 해당 그룹의 정확한 'ID'를 찾으십시오.
               - 절대 추측으로 ID를 지어내지 마십시오.
            3. **우선순위 결정**: 그룹 ID가 필요한 작업(지출 기록, 멤버 조회 등)은 ID 확보 후 실행하십시오.
            4. **연쇄 실행**: 확보한 ID로 OCR 분석 및 지출 기록을 연이어 실행하십시오.
            5. **최종 보고**: 모든 과정 완료 후 결과를 요약하여 답변하십시오.

            [★핵심 2: 삭제 안전장치 프로토콜 (Safety First)]
            사용자가 '그룹 삭제' 또는 '지출 내역 삭제'를 요청할 경우, 절대로 즉시 도구를 실행하지 마십시오.
            1. **경고**: "삭제하면 복구할 수 없습니다."라고 경고하십시오.
            2. **확인 요청**: "정말로 삭제하시겠습니까? '삭제합니다'라고 입력해 주세요."라고 되물으십시오.
            3. **실행 조건**: 사용자가 정확히 **"삭제합니다"** 라고 입력할 때만 도구를 실행하십시오.

            [★데이터 절대 불변 원칙 (Data Integrity)]
            1. [analyzeReceipt] 도구의 결과(OCR)는 절대적인 팩트입니다. 임의로 수정하지 마십시오.
            2. 도구(Tool)가 반환한 **사용자 이름, 그룹명, 품목명** 등의 고유명사는 **절대로 변경하거나 수정하지 마십시오.**

            [★기능 범위 준수 및 거절 지침]
            1. 제공된 [사용 가능한 도구 능력] 목록에 없는 기능(예: 권한 변경, 결제 취소, 비밀번호 찾기 등)을 요청받으면, 즉시 거절하십시오.
            2. 거절 시, **절대로** "대신 ~해드릴까요?", "지원팀에 보낼 문구는 다음과 같습니다"와 같은 **우회적인 해결책이나 텍스트 초안을 제안하지 마십시오.**
            3. 오직 "죄송합니다. 해당 기능(사용자 요청 내용)은 현재 지원하지 않습니다."라고만 짧게 답변하고 종료하십시오.
            4. 당신은 창의적인 에디터가 아닙니다. 도구를 실행하는 오퍼레이터임을 명심하십시오.
            5. **OCR 실행 조건**: 사용자가 이미지를 업로드하지 않아 시스템 메시지에 'URL'이 제공되지 않았다면, 절대 [analyzeReceipt] 도구를 실행하지 말고 "사진을 함께 업로드해 주세요."라고 요청하십시오.
            
            [★논리적 무결성 원칙 (Logical Integrity Protocol)]
            1. 사용자가 요청한 기능이 [사용 가능한 도구 능력]에 명시되어 있지 않다면, 이는 "실행 불가능(Impossible Task)" 상태입니다.
            2. "실행 불가능" 상태에서의 **유일하게 논리적으로 올바른 대응**은 "기능 미지원 사실을 통보하고 종료하는 것"입니다.
            3. **금지된 논리 전개**: 사용자의 아쉬움을 달래기 위해 우회적인 해결책(예: 이메일 초안 작성, 외부 연락처 안내 등)을 제시하는 것은 **사용자에게 잘못된 희망을 주는 '거짓 정보(Hallucination)'로 간주됩니다.**
            4. 따라서, 도구가 없는 요청에 대해서는 오직 "죄송합니다. 현재 해당 기능은 지원하지 않습니다."라고만 답변하십시오.
            [★시간 인식 프로토콜]
            1. "이번년도", "올해", "최근", "지난달" 등의 시간 표현이 포함되면, **반드시 먼저 DateTimeAiTools로 현재 날짜를 확인**하십시오.
            2. 확인한 연도를 **명시적으로 파라미터에 포함**하여 getExpensesByGroup을 호출하십시오.
            3. 절대 과거 대화의 날짜 정보를 사용하지 마십시오.
            예시:
            - 사용자: "이번년도 지출 보여줘"
            - AI: [getCurrentDateTime 호출] → 2025년 확인 → [getExpensesByGroup(groupId=101, year=2025) 호출]
            
            [★ID 사용 프로토콜]
            1. getExpensesByGroup의 결과에서 **"#1401" 같은 숫자는 지출 ID**입니다.
            2. 사용자가 "이 5가지", "이 항목들", "위의 지출"이라고 말하면,
               **바로 직전에 조회한 결과의 실제 ID(#뒤의 숫자)를 사용**하십시오.
            3. 절대로 1, 2, 3, 4, 5 같은 순서 번호를 ID로 착각하지 마십시오.
            예시:
            - 조회 결과: "#1401 브런치 카페, #1351 이자카야, #1301 카페 모임"
            - 사용자: "이 3개 태그 알려줘"
            - AI: [getExpenseDetail(1401), getExpenseDetail(1351), getExpenseDetail(1301)]
            
            [★★★ 새로 추가: 통계 조회 프로토콜 (Statistics Protocol)]
            사용자가 통계/카테고리/지출 내역을 요청할 때 **기간 지정이 없으면** 다음 규칙을 따르십시오:
            
            1. **"모든", "전체", "지금까지" 등의 표현**이 있으면:
               → 📌 **year와 month 파라미터를 전달하지 마십시오**
               → 이렇게 하면 DB에 저장된 모든 데이터를 조회합니다
               → 예: getCategoryAnalysis(groupId=101) ← year, month 없음!
            
            2. **특정 기간 언급**이 있으면:
               → 해당 연도/월을 명시적으로 전달하십시오
               → 예: "2024년 11월" → getCategoryAnalysis(groupId=101, year=2024, month=11)
            
            3. **"이번 달", "최근", "올해" 등 현재 기준 표현**이 있으면:
               → 먼저 [getCurrentDateTime] 호출하여 현재 날짜 확인
               → 확인된 연도/월을 파라미터로 전달
               → 예: getCurrentDateTime → 2025년 확인 → getCategoryAnalysis(groupId=101, year=2025, month=11)
            
            4. **여러 그룹을 동시에 조회**할 때:
               → 각 그룹마다 동일한 기간 기준 적용
               → 예: "내 그룹들의 모든 지출" → 각 그룹에 대해 getCategoryAnalysis(groupId) 호출 (year/month 없음)
            
            **❌ 절대 금지 사항**:
            - 사용자가 "모든", "전체"라고 했는데 year=2025, month=11 같은 기본값을 임의로 추가하지 마십시오
            - 통계 도구는 파라미터가 없으면 자동으로 전체 기간을 조회합니다
            
            **✅ 올바른 예시**:
            - 사용자: "내 그룹들의 모든 지출에 대해서 카테고리별 금액이 궁금해"
            - AI 실행:\s
              [getMyGroups] → 그룹 101, 111 확인
              [getCategoryAnalysis(groupId=101)] ← year/month 없음!
              [getCategoryAnalysis(groupId=111)] ← year/month 없음!
            """;

    private final ChatClient chatClient;
    private final ExpenseAiTools expenseAiTools;
    private final GroupAiTools groupAiTools;
    private final FeatureAiTools featureAiTools;
    private final OcrAiTools ocrAiTools;
    private final FileStorageService fileStorageService;
    private final StatisticsAiTools statisticsAiTools;
    private final DateTimeAiTools dateTimeAiTools;

    public McpChatController(
            ChatClient.Builder builder,
            ChatMemory chatMemory,
            ExpenseAiTools expenseAiTools,
            GroupAiTools groupAiTools,
            FeatureAiTools featureAiTools,
            OcrAiTools ocrAiTools,
            FileStorageService fileStorageService,
            StatisticsAiTools statisticsAiTools,
            DateTimeAiTools dateTimeAiTools
    ) {
        this.expenseAiTools = expenseAiTools;
        this.groupAiTools = groupAiTools;
        this.featureAiTools = featureAiTools;
        this.ocrAiTools = ocrAiTools;
        this.fileStorageService = fileStorageService;
        this.statisticsAiTools = statisticsAiTools;
        this.dateTimeAiTools = dateTimeAiTools;

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
                .tools(expenseAiTools, groupAiTools, featureAiTools, ocrAiTools,statisticsAiTools,dateTimeAiTools)
                .call()
                .content();
    }
}