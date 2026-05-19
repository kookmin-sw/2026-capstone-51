package com.github.logi.domain.user.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;
import java.util.UUID;

public record DashboardResponse(
        Statistics statistics,
        UserExperiences userExperiences,
        List<GraduateUserExperiences> graduateUserExperiences
) {

    @Schema(name = "DashboardStatistics")
    public record Statistics(
            float partTimeAvg,
            float internAvg,
            float licenseAvg,
            float internalAvg,
            float externalAvg,
            UserCounts user
    ) {
        public static float round1(double value) {
            return (float) (Math.round(value * 10) / 10.0);
        }

        public record UserCounts(
                int partTimeCount,
                int internCount,
                int licenseCount,
                int internalCount,
                int externalCount
        ) {
        }
    }

    public record UserExperiences(
            List<ExperienceItem> partTimeHistory,
            List<ExperienceItem> internHistory,
            List<ExperienceItem> licenseHistory,
            List<ExperienceItem> internalHistory,
            List<ExperienceItem> externalHistory
    ) {
    }

    public record ExperienceItem(
            String name,
            UUID experienceId,
            String startDate,
            String endDate
    ) {
    }

    public record GraduateUserExperiences(
            UUID userId,
            String userName,
            List<ExperienceItem> partTimeHistory,
            List<ExperienceItem> internHistory,
            List<ExperienceItem> licenseHistory,
            List<ExperienceItem> internalHistory,
            List<ExperienceItem> externalHistory
    ) {
    }
}
