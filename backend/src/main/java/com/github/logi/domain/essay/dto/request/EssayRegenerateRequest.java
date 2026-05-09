package com.github.logi.domain.essay.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

@Schema(description = "자소서 답변 재생성 요청")
public record EssayRegenerateRequest(
        @Schema(description = "자소서 ID", example = "550e8400-e29b-41d4-a716-446655440000")
        @NotNull UUID essayId,

        @Schema(description = "자소서 문항 ID", example = "660e8400-e29b-41d4-a716-446655440001")
        @NotNull UUID questionId,

        @Schema(description = "현재 작성된 답변 (편집 중인 텍스트 포함)", example = "저는 ...")
        @NotBlank
        @Size(max = 5000, message = "현재 답변은 5000자 이하로 입력해주세요.")
        String currentResponse,

        @Schema(description = "수정 요청 사항", example = "더 구체적인 수치를 넣어주세요.")
        @NotBlank
        @Size(max = 1000, message = "수정 요청은 1000자 이하로 입력해주세요.")
        String questionReq
) {
}
