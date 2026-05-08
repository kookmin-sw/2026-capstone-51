package com.github.logi.domain.essay.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "관련 경험 추천 요청")
public record EssayRecommendRequest(
        @Schema(description = "자소서 문항", example = "지원 동기를 작성해주세요.")
        @NotBlank
        @Size(max = 2000, message = "문항은 2000자 이하로 입력해주세요.")
        String question
) {
}
