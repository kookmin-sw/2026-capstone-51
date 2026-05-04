package com.github.logi.domain.experience.service;

import com.github.logi.domain.experience.dto.request.ExperienceRequest;
import com.github.logi.domain.experience.dto.response.ExperienceListResponse;
import com.github.logi.domain.experience.dto.response.ExperienceResponse;
import com.github.logi.domain.experience.entity.Experience;
import com.github.logi.domain.experience.exception.ExperienceExceptions;
import com.github.logi.domain.experience.repository.ExperienceRepository;
import com.github.logi.domain.user.entity.User;
import com.github.logi.global.sqs.SqsMessagePublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExperienceService {

    private final ExperienceRepository experienceRepository;
    private final SqsMessagePublisher sqsMessagePublisher;

    @Transactional
    public void createExperience(User user, ExperienceRequest request) {
        validateDateRange(request);
        Experience experience = experienceRepository.save(Experience.create(user, request));
        UUID experienceId = experience.getId();
        String starText = buildStarText(experience);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                sqsMessagePublisher.publishStarEmbedding(experienceId, starText);
            }
        });
    }

    public ExperienceListResponse getExperiences(User user) {
        return ExperienceListResponse.from(experienceRepository.findAllByUser(user));
    }

    public ExperienceResponse getExperience(User user, UUID experienceId) {
        Experience experience = experienceRepository.findById(experienceId)
                .orElseThrow(ExperienceExceptions.EXPERIENCE_NOT_FOUND::toException);

        if (!experience.getUser().getId().equals(user.getId())) {
            throw ExperienceExceptions.FORBIDDEN_EXPERIENCE.toException();
        }

        return ExperienceResponse.from(experience);
    }

    @Transactional
    public void updateExperience(User user, UUID experienceId, ExperienceRequest request) {
        validateDateRange(request);

        Experience experience = experienceRepository.findById(experienceId)
                .orElseThrow(ExperienceExceptions.EXPERIENCE_NOT_FOUND::toException);

        if (!experience.getUser().getId().equals(user.getId())) {
            throw ExperienceExceptions.FORBIDDEN_EXPERIENCE.toException();
        }

        experience.update(request);
        String starText = buildStarText(experience);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                sqsMessagePublisher.publishStarEmbedding(experienceId, starText);
            }
        });
    }

    @Transactional
    public void deleteExperience(User user, UUID experienceId) {
        Experience experience = experienceRepository.findById(experienceId)
                .orElseThrow(ExperienceExceptions.EXPERIENCE_NOT_FOUND::toException);

        if (!experience.getUser().getId().equals(user.getId())) {
            throw ExperienceExceptions.FORBIDDEN_EXPERIENCE.toException();
        }

        experienceRepository.delete(experience);
        // TODO: 소프트 삭제이므로 experience_star_embeddings는 유지(자소서 추적성 보존). 별도 정리 불필요.
    }

    private String buildStarText(Experience experience) {
        return experience.getStarS() + " " + experience.getStarT() + " " + experience.getStarA() + " " + experience.getStarR();
    }

    private void validateDateRange(ExperienceRequest request) {
        if (request.startDate().isAfter(request.endDate())) {
            throw ExperienceExceptions.INVALID_DATE_RANGE.toException();
        }
    }
}
