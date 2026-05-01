package com.github.logi.domain.experience.service;

import com.github.logi.domain.experience.dto.request.ExperienceRequest;
import com.github.logi.domain.experience.dto.response.ExperienceListResponse;
import com.github.logi.domain.experience.dto.response.ExperienceResponse;
import com.github.logi.domain.experience.entity.Experience;
import com.github.logi.domain.experience.exception.ExperienceExceptions;
import com.github.logi.domain.experience.repository.ExperienceRepository;
import com.github.logi.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExperienceService {

    private final ExperienceRepository experienceRepository;

    @Transactional
    public void createExperience(User user, ExperienceRequest request) {
        validateDateRange(request);
        experienceRepository.save(Experience.create(user, request));
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
    }

    @Transactional
    public void deleteExperience(User user, UUID experienceId) {
        Experience experience = experienceRepository.findById(experienceId)
                .orElseThrow(ExperienceExceptions.EXPERIENCE_NOT_FOUND::toException);

        if (!experience.getUser().getId().equals(user.getId())) {
            throw ExperienceExceptions.FORBIDDEN_EXPERIENCE.toException();
        }

        experienceRepository.delete(experience);
    }

    private void validateDateRange(ExperienceRequest request) {
        if (request.startDate().isAfter(request.endDate())) {
            throw ExperienceExceptions.INVALID_DATE_RANGE.toException();
        }
    }
}
