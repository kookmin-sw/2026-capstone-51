package com.github.logi.domain.essay.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;
import java.util.UUID;

public record EssayQuestionCreateRequest(
        @NotNull Integer questionNum,
        @NotBlank String question,
        @NotBlank String response,
        @NotNull @Positive Integer maxLength,
        List<RelatedExperience> relatedExperience
) {
    public record RelatedExperience(UUID experienceId) {}
}
