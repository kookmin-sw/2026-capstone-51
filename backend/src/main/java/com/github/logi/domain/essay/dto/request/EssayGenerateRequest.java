package com.github.logi.domain.essay.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

@Schema(description = "자소서 답변 생성 요청")
public record EssayGenerateRequest(
        @Schema(description = "자소서 ID", example = "550e8400-e29b-41d4-a716-446655440000")
        @NotNull UUID essayId,

        @Schema(description = "자소서 문항 ID", example = "660e8400-e29b-41d4-a716-446655440001")
        @NotNull UUID questionId
) {
}
