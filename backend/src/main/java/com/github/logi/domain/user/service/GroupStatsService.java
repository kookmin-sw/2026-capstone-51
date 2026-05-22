package com.github.logi.domain.user.service;

import com.github.logi.domain.certificate.repository.CertificateRepository;
import com.github.logi.domain.experience.entity.ExperienceCategory;
import com.github.logi.domain.experience.repository.ExperienceRepository;
import com.github.logi.domain.user.entity.GroupBy;
import com.github.logi.domain.user.entity.KookminDepartment;
import com.github.logi.domain.user.entity.State;
import com.github.logi.domain.user.repository.UserRepository;
import com.github.logi.global.config.CacheConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 그룹 집계 결과를 캐싱하는 서비스.
 * UserStatsService 내부에서 자기 자신을 호출하면 Spring AOP 프록시를 우회하므로
 * 별도 Bean으로 분리하여 @Cacheable이 정상 동작하도록 한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GroupStatsService {

    private final ExperienceRepository experienceRepository;
    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;

    @Cacheable(
            cacheNames = CacheConfig.USER_STATS_CACHE,
            key = "#major.name() + '_' + #groupBy.name() + '_' + #groupKey"
    )
    public GroupAvgResult fetchGroupAvg(KookminDepartment major, GroupBy groupBy, String groupKey, State state) {
        List<ExperienceRepository.CategoryTotalView> expTotalList;
        List<ExperienceRepository.CategoryMaxCountView> expMaxCountList;
        Long licenseTotal;
        Long licenseMaxCount;
        long userCount;

        switch (groupBy) {
            case STATE -> {
                userCount = userRepository.countByMajorAndState(major, state);
                expTotalList = experienceRepository.findCategoryTotalByMajorAndState(major, state);
                expMaxCountList = experienceRepository.findCategoryMaxCountByMajorAndState(major.name(), state.name());
                licenseTotal = certificateRepository.countLicenseTotalByMajorAndState(major, state);
                licenseMaxCount = certificateRepository.findLicenseMaxCountByMajorAndState(major, state);
            }
            case SCHOOL_NUM -> {
                userCount = userRepository.countByMajorAndSchoolNumPrefix(major, groupKey);
                expTotalList = experienceRepository.findCategoryTotalByMajorAndSchoolNum(major, groupKey);
                expMaxCountList = experienceRepository.findCategoryMaxCountByMajorAndSchoolNum(major.name(), groupKey);
                licenseTotal = certificateRepository.countLicenseTotalByMajorAndSchoolNum(major, groupKey);
                licenseMaxCount = certificateRepository.findLicenseMaxCountByMajorAndSchoolNum(major, groupKey);
            }
            case WORKER -> {
                userCount = userRepository.countByMajorAndState(major, State.WORKER);
                expTotalList = experienceRepository.findCategoryTotalByMajorAndWorker(major);
                expMaxCountList = experienceRepository.findCategoryMaxCountByMajorAndWorker(major.name());
                licenseTotal = certificateRepository.countLicenseTotalByMajorAndWorker(major);
                licenseMaxCount = certificateRepository.findLicenseMaxCountByMajorAndWorker(major);
            }
            default -> throw new IllegalArgumentException("Unsupported groupBy: " + groupBy);
        }

        if (userCount == 0) {
            return new GroupAvgResult(Map.of(), Map.of(), 0.0, 0L);
        }

        Map<ExperienceCategory, Double> avgMap = expTotalList.stream()
                .collect(Collectors.toMap(
                        ExperienceRepository.CategoryTotalView::getCategory,
                        v -> v.getTotal() != null ? v.getTotal() * 1.0 / userCount : 0.0
                ));
        Map<ExperienceCategory, Long> maxCountMap = expMaxCountList.stream()
                .collect(Collectors.toMap(
                        v -> ExperienceCategory.valueOf(v.getCategory()),
                        v -> v.getMaxCount() != null ? v.getMaxCount() : 0L
                ));
        double licenseAvg = licenseTotal != null ? licenseTotal * 1.0 / userCount : 0.0;

        return new GroupAvgResult(
                avgMap,
                maxCountMap,
                licenseAvg,
                licenseMaxCount != null ? licenseMaxCount : 0L
        );
    }

    public record GroupAvgResult(
            Map<ExperienceCategory, Double> avgMap,
            Map<ExperienceCategory, Long> maxCountMap,
            double licenseAvg,
            long licenseMaxCount
    ) {
    }

    @Cacheable(
            cacheNames = CacheConfig.USER_STATS_CACHE,
            key = "'rank_' + #major.name() + '_' + #groupBy.name() + '_' + #groupKey"
    )
    public List<TopRankerData> fetchTopRankers(KookminDepartment major, GroupBy groupBy, String groupKey, State state) {
        List<ExperienceRepository.UserCategoryCountView> expCounts = switch (groupBy) {
            case STATE -> experienceRepository.findExpCountPerUserByMajorAndState(major, state);
            case SCHOOL_NUM -> experienceRepository.findExpCountPerUserByMajorAndSchoolNum(major, groupKey);
            case WORKER -> experienceRepository.findExpCountPerUserByMajorAndWorker(major);
        };

        List<CertificateRepository.UserCertCountView> certCounts = switch (groupBy) {
            case STATE -> certificateRepository.findCertCountPerUserByMajorAndState(major, state);
            case SCHOOL_NUM -> certificateRepository.findCertCountPerUserByMajorAndSchoolNum(major, groupKey);
            case WORKER -> certificateRepository.findCertCountPerUserByMajorAndWorker(major);
        };

        // [PARTTIME, EXTERNAL, INTERNAL, INTERN, LICENSE]
        Map<UUID, long[]> countMap = new HashMap<>();
        Map<UUID, String> nameMap = new HashMap<>();

        for (var v : expCounts) {
            UUID uid = v.getUserId();
            nameMap.put(uid, v.getUserName());
            long[] counts = countMap.computeIfAbsent(uid, k -> new long[5]);
            int idx = switch (v.getCategory()) {
                case PARTTIME -> 0;
                case EXTERNAL -> 1;
                case INTERNAL -> 2;
                case INTERN -> 3;
            };
            counts[idx] = v.getCnt();
        }

        for (var v : certCounts) {
            UUID uid = v.getUserId();
            nameMap.putIfAbsent(uid, v.getUserName());
            countMap.computeIfAbsent(uid, k -> new long[5])[4] = v.getCnt();
        }

        return countMap.entrySet().stream()
                .map(e -> {
                    long[] c = e.getValue();
                    long total = c[0] + c[1] + c[2] + c[3] + c[4];
                    return new TopRankerData(nameMap.get(e.getKey()), c, total);
                })
                .sorted(Comparator.comparingLong(TopRankerData::total).reversed())
                .limit(3)
                .toList();
    }

    public record TopRankerData(String userName, long[] counts, long total) {
    }
}
