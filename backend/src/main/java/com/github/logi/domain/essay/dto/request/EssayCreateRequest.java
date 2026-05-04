package com.github.logi.domain.essay.dto.request;

import jakarta.validation.constraints.NotBlank;

public record EssayCreateRequest(
        @NotBlank String companyName,
        @NotBlank String wishJob,
        @NotBlank String globalReq
) {
}
