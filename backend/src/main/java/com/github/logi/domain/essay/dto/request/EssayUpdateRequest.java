package com.github.logi.domain.essay.dto.request;

import jakarta.validation.constraints.NotBlank;

public record EssayUpdateRequest(
        @NotBlank String companyName,
        @NotBlank String wishJob,
        @NotBlank String globalReq
) {
}
