package com.github.logi.domain.essay.dto.request;

import com.github.logi.domain.essay.entity.Progress;
import jakarta.validation.constraints.NotNull;

public record EssayResultUpdateRequest(
        @NotNull Progress progress
) {
}
