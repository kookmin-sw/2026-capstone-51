package com.github.logi.domain.essay.dto.response;

import com.github.logi.domain.essay.entity.Essay;
import com.github.logi.domain.essay.entity.EssayQuestion;
import com.github.logi.domain.essay.entity.Progress;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Schema(description = "자소서 상세 응답")
public record EssayDetailResponse(
        @Schema(description = "지원 회사명", example = "토스")
        String companyName,

        @Schema(description = "공통 요구사항(인재상 등)", example = "도전을 두려워하지 않는 인재")
        String requirement,

        @Schema(description = "자소서 문항 목록")
        List<QuestionResponse> questions,

        @Schema(description = "희망 직무", example = "백엔드 엔지니어")
        String wishJob,

        @Schema(description = "진행 상태", example = "IN_PROGRESS")
        Progress progress,

        @Schema(description = "최종 수정 일자", example = "2026-05-01")
        LocalDate modifiedDate
) {
    @Schema(description = "자소서 문항")
    public record QuestionResponse(
            @Schema(description = "문항 ID", example = "550e8400-e29b-41d4-a716-446655440000")
            UUID questionId,

            @Schema(description = "문항 번호", example = "1")
            Integer questionNum,

            @Schema(description = "문항 내용", example = "지원 동기를 작성해주세요.")
            String question,

            @Schema(description = "답변 내용", example = "저는 ...")
            String response,

            @Schema(description = "답변 최대 글자수", example = "500")
            Integer maxLength
    ) {
        public static QuestionResponse from(EssayQuestion question) {
            return new QuestionResponse(
                    question.getId(),
                    question.getQuestionNum(),
                    question.getQuestion(),
                    question.getResponse(),
                    question.getMaxLength()
            );
        }
    }

    public static EssayDetailResponse from(Essay essay) {
        return new EssayDetailResponse(
                essay.getCompanyName(),
                essay.getGlobalReq(),
                essay.getQuestions().stream()
                        .map(QuestionResponse::from)
                        .toList(),
                essay.getWishJob(),
                essay.getProgress(),
                essay.getUpdatedAt().toLocalDate()
        );
    }
}
