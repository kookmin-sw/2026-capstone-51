package com.github.logi.domain.essay.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.UUID;

public record EssayQuestionUpdateRequest(
        @NotBlank String question,
        @NotBlank String response,
        List<RelatedExperience> relatedExperience
) {
    public record RelatedExperience(UUID experienceId) {}
}
