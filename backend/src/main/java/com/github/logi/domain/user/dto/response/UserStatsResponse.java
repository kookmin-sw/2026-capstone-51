package com.github.logi.domain.user.dto.response;

import com.github.logi.domain.experience.entity.ExperienceCategory;

import java.util.List;

public record UserStatsResponse(
        Statistics statistics,
        List<WeakPoint> weakPoints,
        List<RankedUser> topRankers
) {

    public record Statistics(
            CategoryStat partTime,
            CategoryStat external,
            CategoryStat internal,
            CategoryStat license,
            CategoryStat intern
    ) {
    }

    public record CategoryStat(
            float avg,
            int maxCount,
            int myCount
    ) {
        public static CategoryStat of(double avg, long maxCount, long myCount) {
            return new CategoryStat(round1(avg), (int) maxCount, (int) myCount);
        }

        public static CategoryStat empty(long myCount) {
            return new CategoryStat(0f, 0, (int) myCount);
        }

        private static float round1(double value) {
            return (float) (Math.round(value * 10) / 10.0);
        }
    }

    public record WeakPoint(
            String type,
            List<String> recommendedItems
    ) {
        public static WeakPoint of(ExperienceCategory category, List<String> items) {
            return new WeakPoint(category.name(), items);
        }

        public static WeakPoint license(List<String> items) {
            return new WeakPoint("LICENSE", items);
        }
    }

    public record RankedUser(
            int rank,
            String userName,
            int totalCount,
            int partTimeCount,
            int externalCount,
            int internalCount,
            int internCount,
            int licenseCount
    ) {
    }
}
