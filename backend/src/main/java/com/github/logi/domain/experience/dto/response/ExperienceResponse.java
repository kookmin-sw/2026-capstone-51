package com.github.logi.domain.experience.dto.response;

import com.github.logi.domain.experience.entity.Experience;
import com.github.logi.domain.experience.entity.ExperienceCategory;
import com.github.logi.domain.user.entity.KookminDepartment;
import com.github.logi.domain.user.entity.State;

import java.time.LocalDate;
import java.util.UUID;

public record ExperienceResponse(
        UUID experienceId,
        ExperienceCategory experienceCategory,
        State stateAtCreation,
        KookminDepartment relatedMajor,
        String experienceTitle,
        LocalDate startDate,
        LocalDate endDate,
        StarStructure starStructure
) {
    public record StarStructure(
            String s,
            String t,
            String a,
            String r
    ) {
    }

    public static ExperienceResponse from(Experience experience) {
        return new ExperienceResponse(
                experience.getId(),
                experience.getExperienceCategory(),
                experience.getStateAtCreation(),
                experience.getRelatedMajor(),
                experience.getExperienceTitle(),
                experience.getStartDate(),
                experience.getEndDate(),
                new StarStructure(
                        experience.getStarS(),
                        experience.getStarT(),
                        experience.getStarA(),
                        experience.getStarR()
                )
        );
    }
}
