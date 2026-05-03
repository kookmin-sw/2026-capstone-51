package com.github.logi.domain.essay.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record EssayQuestionCreateRequest(
        @NotNull Integer questionNum,
        @NotBlank String question,
        @NotBlank String response,
        List<RelatedExperience> relatedExperience
) {
    public record RelatedExperience(UUID experienceId) {}
}
