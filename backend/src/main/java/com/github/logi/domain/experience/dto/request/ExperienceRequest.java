package com.github.logi.domain.experience.dto.request;

import com.github.logi.domain.experience.entity.ExperienceCategory;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record ExperienceRequest(
        @NotNull ExperienceCategory experienceCategory,
        @NotBlank @Size(max = 100) String relatedMajor,
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
