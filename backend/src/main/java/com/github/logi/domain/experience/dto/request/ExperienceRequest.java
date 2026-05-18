package com.github.logi.domain.experience.dto.request;

import com.github.logi.domain.experience.entity.ExperienceCategory;
import com.github.logi.domain.user.entity.KookminDepartment;
import com.github.logi.domain.user.entity.State;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import java.time.LocalDate;

public record ExperienceRequest(
        @NotNull ExperienceCategory experienceCategory,
        @NotNull State stateAtCreation,
        @NotNull KookminDepartment relatedMajor,
        @NotBlank @Size(max = 200) String experienceTitle,
        @NotNull @PastOrPresent LocalDate startDate,
        @NotNull @PastOrPresent LocalDate endDate,
        @NotNull @Valid StarStructure starStructure
) {
    public record StarStructure(
            @NotBlank String s,
            @NotBlank String t,
            @NotBlank String a,
            @NotBlank String r
    ) {
    }
}
