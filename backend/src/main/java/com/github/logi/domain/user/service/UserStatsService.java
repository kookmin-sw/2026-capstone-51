package com.github.logi.domain.user.service;

import com.github.logi.domain.certificate.repository.CertificateRepository;
import com.github.logi.domain.experience.entity.ExperienceCategory;
import com.github.logi.domain.experience.repository.ExperienceRepository;
import com.github.logi.domain.user.dto.response.UserStatsResponse;
import com.github.logi.domain.user.dto.response.UserStatsResponse.CategoryStat;
import com.github.logi.domain.user.dto.response.UserStatsResponse.Statistics;
import com.github.logi.domain.user.dto.response.UserStatsResponse.WeakPoint;
import com.github.logi.domain.user.entity.GroupBy;
import com.github.logi.domain.user.entity.KookminDepartment;
import com.github.logi.domain.user.entity.State;
import com.github.logi.domain.user.entity.User;
import com.github.logi.domain.user.service.GroupStatsService.GroupAvgResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.PageRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserStatsService {

    private static final int RECOMMEND_TOP_N = 3;

    private final ExperienceRepository experienceRepository;
    private final CertificateRepository certificateRepository;
    private final GroupStatsService groupStatsService;

    public UserStatsResponse getStats(User user, GroupBy groupBy) {
        GroupContext ctx = buildContext(user, groupBy);
        GroupAvgResult groupAvg = groupStatsService.fetchGroupAvg(user.getMajor(), ctx.groupBy(), ctx.groupKey(), ctx.state());

        Map<ExperienceCategory, Long> myCountMap = experienceRepository.findUserCategoryCount(user).stream()
                .collect(Collectors.toMap(
                        ExperienceRepository.CategoryCountView::getCategory,
                        ExperienceRepository.CategoryCountView::getCnt
                ));
        long myLicenseCount = certificateRepository.countByUser(user);

        Statistics statistics = buildStatistics(groupAvg, myCountMap, myLicenseCount);
        List<WeakPoint> weakPoints = buildWeakPoints(user, ctx, statistics);
        return new UserStatsResponse(statistics, weakPoints);
    }

    private Statistics buildStatistics(GroupAvgResult groupAvg, Map<ExperienceCategory, Long> myCountMap, long myLicenseCount) {
        return new Statistics(
                buildCategoryStat(ExperienceCategory.PARTTIME, groupAvg, myCountMap),
                buildCategoryStat(ExperienceCategory.EXTERNAL, groupAvg, myCountMap),
                buildCategoryStat(ExperienceCategory.INTERNAL, groupAvg, myCountMap),
                CategoryStat.of(groupAvg.licenseAvg(), groupAvg.licenseUserCount(), myLicenseCount),
                buildCategoryStat(ExperienceCategory.INTERN, groupAvg, myCountMap)
        );
    }

    private CategoryStat buildCategoryStat(
            ExperienceCategory category,
            GroupAvgResult groupAvg,
            Map<ExperienceCategory, Long> myCountMap
    ) {
        double avg = groupAvg.avgMap().getOrDefault(category, 0.0);
        long userCount = groupAvg.userCountMap().getOrDefault(category, 0L);
        long myCount = myCountMap.getOrDefault(category, 0L);
        return CategoryStat.of(avg, userCount, myCount);
    }

    private List<WeakPoint> buildWeakPoints(User user, GroupContext ctx, Statistics statistics) {
        List<WeakPoint> weakPoints = new ArrayList<>();

        checkExperienceWeakPoint(user, ctx, ExperienceCategory.PARTTIME, statistics.partTime(), weakPoints);
        checkExperienceWeakPoint(user, ctx, ExperienceCategory.EXTERNAL, statistics.external(), weakPoints);
        checkExperienceWeakPoint(user, ctx, ExperienceCategory.INTERNAL, statistics.internal(), weakPoints);
        checkExperienceWeakPoint(user, ctx, ExperienceCategory.INTERN, statistics.intern(), weakPoints);

        if (statistics.license().myCount() < statistics.license().avg()) {
            List<String> recommendedCerts = fetchTopCertNames(user.getMajor(), ctx);
            weakPoints.add(WeakPoint.license(recommendedCerts));
        }

        return weakPoints;
    }

    private void checkExperienceWeakPoint(
            User user,
            GroupContext ctx,
            ExperienceCategory category,
            CategoryStat stat,
            List<WeakPoint> weakPoints
    ) {
        if (stat.myCount() < stat.avg()) {
            List<String> topTitles = fetchTopExperienceTitles(user, ctx, category);
            weakPoints.add(WeakPoint.of(category, topTitles));
        }
    }

    private List<String> fetchTopExperienceTitles(User user, GroupContext ctx, ExperienceCategory category) {
        PageRequest page = PageRequest.of(0, RECOMMEND_TOP_N);
        List<ExperienceRepository.TitleCountView> views = switch (ctx.groupBy()) {
            case STATE -> experienceRepository.findTopTitlesByMajorAndStateAndCategory(user.getMajor(), ctx.state(), category, user, page);
            case SCHOOL_NUM -> experienceRepository.findTopTitlesByMajorAndSchoolNumAndCategory(user.getMajor(), ctx.groupKey(), category, user, page);
            case WORKER -> experienceRepository.findTopTitlesByMajorAndWorkerAndCategory(user.getMajor(), category, user, page);
        };
        return views.stream()
                .map(ExperienceRepository.TitleCountView::getTitle)
                .toList();
    }

    private List<String> fetchTopCertNames(KookminDepartment major, GroupContext ctx) {
        List<CertificateRepository.CertNameCountView> views = switch (ctx.groupBy()) {
            case STATE -> certificateRepository.findTopCertNamesByMajorAndState(major, ctx.state());
            case SCHOOL_NUM -> certificateRepository.findTopCertNamesByMajorAndSchoolNum(major, ctx.groupKey());
            case WORKER -> certificateRepository.findTopCertNamesByMajorAndWorker(major);
        };
        return views.stream()
                .limit(RECOMMEND_TOP_N)
                .map(CertificateRepository.CertNameCountView::getName)
                .toList();
    }

    private GroupContext buildContext(User user, GroupBy groupBy) {
        return switch (groupBy) {
            case STATE -> new GroupContext(groupBy, user.getState() != null ? user.getState().name() : "", user.getState());
            case SCHOOL_NUM -> {
                String prefix = user.getSchoolNumber() != null && user.getSchoolNumber().length() >= 2
                        ? user.getSchoolNumber().substring(0, 2)
                        : "";
                yield new GroupContext(groupBy, prefix, null);
            }
            case WORKER -> new GroupContext(groupBy, "WORKER", State.WORKER);
        };
    }

    public record GroupContext(GroupBy groupBy, String groupKey, State state) {
    }
}
