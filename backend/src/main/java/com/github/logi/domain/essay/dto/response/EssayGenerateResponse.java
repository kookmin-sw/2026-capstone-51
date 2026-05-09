package com.github.logi.domain.essay.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "자소서 답변 생성 응답")
public record EssayGenerateResponse(
        @Schema(description = "생성된 자소서 답변", example = "저는 ...")
        String response
) {
}
