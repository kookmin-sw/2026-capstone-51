package com.github.logi.domain.user.service;

import com.github.logi.domain.certificate.entity.Certificate;
import com.github.logi.domain.certificate.repository.CertificateRepository;
import com.github.logi.domain.experience.entity.Experience;
import com.github.logi.domain.experience.entity.ExperienceCategory;
import com.github.logi.domain.experience.repository.ExperienceRepository;
import com.github.logi.domain.user.dto.response.DashboardResponse;
import com.github.logi.domain.user.dto.response.DashboardResponse.ExperienceItem;
import com.github.logi.domain.user.dto.response.DashboardResponse.GraduateUserExperiences;
import com.github.logi.domain.user.dto.response.DashboardResponse.Statistics;
import com.github.logi.domain.user.dto.response.DashboardResponse.Statistics.UserCounts;
import com.github.logi.domain.user.dto.response.DashboardResponse.UserExperiences;
import com.github.logi.domain.user.entity.User;
import com.github.logi.domain.user.repository.UserRepository;
import com.github.logi.domain.user.service.GroupStatsService.GroupAvgResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.github.logi.domain.user.entity.GroupBy.STATE;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final ExperienceRepository experienceRepository;
    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;
    private final GroupStatsService groupStatsService;

    public DashboardResponse getDashboard(User user) {
        String groupKey = user.getState() != null ? user.getState().name() : "";
        GroupAvgResult groupAvg = groupStatsService.fetchGroupAvg(user.getMajor(), STATE, groupKey, user.getState());

        // 내 경험/자격증 한 번만 조회 → statistics + userExperiences 양쪽에서 재사용
        List<Experience> myExperiences = experienceRepository.findAllByUser(user);
        List<Certificate> myCertificates = certificateRepository.findAllByUser(user);
        Map<ExperienceCategory, List<Experience>> myByCategory = myExperiences.stream()
                .collect(Collectors.groupingBy(Experience::getExperienceCategory));

        Statistics statistics = buildStatistics(myByCategory, myCertificates, groupAvg);
        UserExperiences userExperiences = buildUserExperiences(myByCategory, myCertificates);
        List<GraduateUserExperiences> graduateUserExperiences = buildGraduateUserExperiences(user);

        return new DashboardResponse(statistics, userExperiences, graduateUserExperiences);
    }

    private Statistics buildStatistics(
            Map<ExperienceCategory, List<Experience>> myByCategory,
            List<Certificate> myCertificates,
            GroupAvgResult groupAvg
    ) {
        return new Statistics(
                Statistics.round1(groupAvg.avgMap().getOrDefault(ExperienceCategory.PARTTIME, 0.0)),
                Statistics.round1(groupAvg.avgMap().getOrDefault(ExperienceCategory.INTERN, 0.0)),
                Statistics.round1(groupAvg.licenseAvg()),
                Statistics.round1(groupAvg.avgMap().getOrDefault(ExperienceCategory.INTERNAL, 0.0)),
                Statistics.round1(groupAvg.avgMap().getOrDefault(ExperienceCategory.EXTERNAL, 0.0)),
                new UserCounts(
                        myByCategory.getOrDefault(ExperienceCategory.PARTTIME, List.of()).size(),
                        myByCategory.getOrDefault(ExperienceCategory.INTERN, List.of()).size(),
                        myCertificates.size(),
                        myByCategory.getOrDefault(ExperienceCategory.INTERNAL, List.of()).size(),
                        myByCategory.getOrDefault(ExperienceCategory.EXTERNAL, List.of()).size()
                )
        );
    }

    private UserExperiences buildUserExperiences(
            Map<ExperienceCategory, List<Experience>> myByCategory,
            List<Certificate> myCertificates
    ) {
        return new UserExperiences(
                toExperienceItems(myByCategory.getOrDefault(ExperienceCategory.PARTTIME, List.of())),
                toExperienceItems(myByCategory.getOrDefault(ExperienceCategory.INTERN, List.of())),
                toCertificateItems(myCertificates),
                toExperienceItems(myByCategory.getOrDefault(ExperienceCategory.INTERNAL, List.of())),
                toExperienceItems(myByCategory.getOrDefault(ExperienceCategory.EXTERNAL, List.of()))
        );
    }

    private List<GraduateUserExperiences> buildGraduateUserExperiences(User user) {
        List<User> workers = findMatchingWorkers(user);
        if (workers.isEmpty()) {
            return List.of();
        }

        // IN 쿼리로 한 번에 조회 (N+1 방지)
        List<Experience> allWorkerExperiences = experienceRepository.findAllByUserIn(workers);
        List<Certificate> allWorkerCertificates = certificateRepository.findAllByUserIn(workers);

        Map<UUID, List<Experience>> expByWorker = allWorkerExperiences.stream()
                .collect(Collectors.groupingBy(e -> e.getUser().getId()));
        Map<UUID, List<Certificate>> certByWorker = allWorkerCertificates.stream()
                .collect(Collectors.groupingBy(c -> c.getUser().getId()));

        return workers.stream()
                .map(worker -> {
                    Map<ExperienceCategory, List<Experience>> byCategory = expByWorker
                            .getOrDefault(worker.getId(), List.of()).stream()
                            .collect(Collectors.groupingBy(Experience::getExperienceCategory));
                    List<Certificate> certs = certByWorker.getOrDefault(worker.getId(), List.of());

                    return new GraduateUserExperiences(
                            worker.getId(),
                            toExperienceItems(byCategory.getOrDefault(ExperienceCategory.PARTTIME, List.of())),
                            toExperienceItems(byCategory.getOrDefault(ExperienceCategory.INTERN, List.of())),
                            toCertificateItems(certs),
                            toExperienceItems(byCategory.getOrDefault(ExperienceCategory.INTERNAL, List.of())),
                            toExperienceItems(byCategory.getOrDefault(ExperienceCategory.EXTERNAL, List.of()))
                    );
                })
                .toList();
    }

    private List<User> findMatchingWorkers(User user) {
        if (user.getJobThird() != null) {
            List<User> result = userRepository.findWorkersByMajorAndJobThird(user.getMajor(), user.getJobThird(), user);
            if (!result.isEmpty()) return result;
        }
        if (user.getJobSecond() != null) {
            List<User> result = userRepository.findWorkersByMajorAndJobSecond(user.getMajor(), user.getJobSecond(), user);
            if (!result.isEmpty()) return result;
        }
        if (user.getJobFirst() != null) {
            return userRepository.findWorkersByMajorAndJobFirst(user.getMajor(), user.getJobFirst(), user);
        }
        return List.of();
    }

    private List<ExperienceItem> toExperienceItems(List<Experience> experiences) {
        return experiences.stream()
                .map(e -> new ExperienceItem(
                        e.getExperienceTitle(),
                        e.getId(),
                        e.getStartDate() != null ? e.getStartDate().toString() : null,
                        e.getEndDate() != null ? e.getEndDate().toString() : null
                ))
                .toList();
    }

    private List<ExperienceItem> toCertificateItems(List<Certificate> certificates) {
        return certificates.stream()
                .map(c -> new ExperienceItem(
                        c.getCertificateName(),
                        c.getId(),
                        null,
                        c.getExpirationDate()
                ))
                .toList();
    }
}
