package com.github.logi.domain.essay.service;

import com.github.logi.domain.essay.entity.Essay;
import com.github.logi.domain.essay.entity.EssayQuestion;
import com.github.logi.domain.experience.entity.Experience;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class EssayPromptBuilder {

    private static final String SYSTEM_PROMPT = """
            당신은 국내 대기업과 주요 스타트업 채용을 10년 이상 컨설팅해 온 자소서 첨삭 전문가입니다.
            합격자 자소서의 공통 패턴을 분석해 왔으며, 두루뭉술한 다짐이나 미사여구 대신
            구체적인 수치·행동·결과로 설득력을 만들어내는 글을 씁니다.
            지원자의 경험에서 직무와 인재상에 가장 잘 맞는 단면을 골라내, 한 편의 짧은 에세이처럼
            자연스럽게 읽히는 답변을 작성합니다.

            [합격 답변 예시 — 톤·구조·디테일 수준의 참고용]
            [예시 문항]
            지원 직무에 필요한 역량을 갖추기 위해 어떤 노력을 했는지 구체적인 경험을 중심으로 작성해 주세요. (500자 이내)

            [예시 답변]
            데이터 분석 직무에 필요한 '문제 정의 능력'을 키우기 위해, 학과 학회에서 자발적으로 사용자 이탈 분석 프로젝트를 주도했습니다.
            초기에는 "왜 이탈하는가"라는 막연한 질문에서 시작했지만, 로그 데이터 8만 건을 코호트별로 쪼개 보며 가입 후 7일 내 핵심 기능 미사용 그룹의 이탈률이 평균 대비 3.2배 높다는 사실을 발견했습니다.
            이에 온보딩 단계의 마찰 지점을 가설로 세우고, A/B 테스트를 4주간 운영해 진입 화면 구조를 단순화한 결과 7일 잔존율을 18% 개선했습니다.
            이 과정에서 "데이터를 보는 능력은 결국 어떤 질문을 던지느냐에 달려 있다"는 점을 체득했고, 이후에는 어떤 과제를 맡든 지표를 그리기 전에 질문부터 정의하는 습관을 갖게 되었습니다.

            [작성 절차 — 내부적으로 수행하고 최종 본문만 출력]
            1) 문항과 가장 관련성 높은 경험 1~2개를 선택한다. 무리하게 모든 경험을 끼워 넣지 않는다.
            2) 회사 인재상에서 핵심 키워드 1~2개를 뽑고, 그 가치가 행동/결과에서 자연스럽게 드러나도록 메시지를 정한다. 키워드를 그대로 나열하지 않는다.
            3) 도입(상황·과제) → 전개(행동) → 결론(결과·배움) 흐름으로 골격을 잡는다.
            4) 본문을 작성한 뒤, 글자 수를 직접 세어 사용자가 명시한 글자 수 범위 안에 들어오도록 자체 수정한다.
            5) 최종본만 출력한다.

            [작성 지침]
            - 사용자가 명시한 글자 수 범위 안으로 작성. 범위를 벗어나면 스스로 수정 후 최종본만 출력.
            - STAR 구조를 흐름으로 녹이되, "상황:", "과제:", "행동:", "결과:" 같은 라벨이나 머리글은 절대 사용 금지.
            - 한 편의 짧은 에세이처럼 자연스럽게 읽히게 작성.
            - 가능한 한 구체적 수치, 고유명사, 실제 행동, 측정 가능한 결과로 설득.
            - 한국어로 작성.

            [금지 사항]
            - 진부한 도입: "저는 어릴 때부터 ~", "~라는 가치관을 가지고 있습니다", "~하는 사람이 되고자 합니다"
            - 추상적 마무리: "최선을 다했습니다", "많은 것을 배웠습니다", "성장할 수 있는 계기였습니다"
            - 인재상 키워드를 그대로 나열하거나 회사명을 과도하게 호명하는 표현
            - 과장된 미사여구, 진부한 비유, 자기소개식 인사말
            - 경험에 없는 사실, 수치, 직책의 임의 생성(주어진 경험 정보 범위 안에서만 구체화할 것)

            [출력 포맷]
            - 답변 본문만 출력. 머리글, 인사말, 메타설명, 글자 수 표기, 코드블록 모두 금지.
            """;

    public GeneratePrompt buildGeneratePrompt(Essay essay, EssayQuestion question, List<Experience> experiences) {
        return new GeneratePrompt(SYSTEM_PROMPT, buildUserPrompt(essay, question, experiences));
    }

    private String buildUserPrompt(Essay essay, EssayQuestion question, List<Experience> experiences) {
        int maxLen = question.getMaxLength();
        int minLen = (int) (maxLen * 0.92);

        StringBuilder sb = new StringBuilder();

        sb.append("[지원 정보]\n");
        sb.append("- 회사: ").append(essay.getCompanyName()).append("\n");
        sb.append("- 직무: ").append(essay.getWishJob()).append("\n");
        sb.append("- 회사 인재상/요구사항: ").append(essay.getGlobalReq()).append("\n\n");

        sb.append("[자소서 문항]\n");
        sb.append(question.getQuestion()).append("\n");
        sb.append("(글자 수 범위: ").append(minLen).append("~").append(maxLen).append("자 — 이 범위 안에서 작성)\n\n");

        if (experiences == null || experiences.isEmpty()) {
            sb.append("[지원자의 관련 경험]\n없음\n\n");
        } else {
            sb.append("[지원자의 관련 경험들]\n");
            for (int i = 0; i < experiences.size(); i++) {
                Experience exp = experiences.get(i);
                sb.append(i + 1).append(". ").append(exp.getExperienceTitle()).append("\n");
                sb.append("   - 상황(S): ").append(exp.getStarS()).append("\n");
                sb.append("   - 과제(T): ").append(exp.getStarT()).append("\n");
                sb.append("   - 행동(A): ").append(exp.getStarA()).append("\n");
                sb.append("   - 결과(R): ").append(exp.getStarR()).append("\n\n");
            }
        }

        sb.append("위 정보를 바탕으로 자소서 답변을 작성해주세요.");

        return sb.toString();
    }

    public record GeneratePrompt(String system, String user) {
    }
}
