package com.github.logi.domain.experience.dto.response;

import com.github.logi.domain.experience.entity.Experience;

import java.util.List;

public record ExperienceListResponse(
        List<ExperienceResponse> experiences
) {
    public static ExperienceListResponse from(List<Experience> experiences) {
        return new ExperienceListResponse(
                experiences.stream()
                        .map(ExperienceResponse::from)
                        .toList()
        );
    }
}
