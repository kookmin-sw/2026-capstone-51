package com.github.logi.domain.essay.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;
import java.util.UUID;

@Schema(description = "관련 경험 추천 응답")
public record EssayRecommendResponse(
        @Schema(description = "관련 경험 목록")
        List<RelatedExperience> relatedExperience
) {
    @Schema(description = "관련 경험")
    public record RelatedExperience(
            @Schema(description = "경험 ID", example = "550e8400-e29b-41d4-a716-446655440000")
            UUID experienceId,

            @Schema(description = "경험 제목", example = "교내 해커톤 참여")
            String experienceTitle,

            @Schema(description = "유사도 점수 (0.0 ~ 1.0, 1에 가까울수록 유사)", example = "0.88")
            double similarity
    ) {
    }
}
