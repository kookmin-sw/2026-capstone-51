package com.github.logi.domain.essay.service;

import com.github.logi.domain.essay.dto.request.EssayCreateRequest;
import com.github.logi.domain.essay.dto.request.EssayQuestionCreateRequest;
import com.github.logi.domain.essay.dto.request.EssayQuestionUpdateRequest;
import com.github.logi.domain.essay.dto.request.EssayUpdateRequest;
import com.github.logi.domain.essay.dto.response.EssayCreateResponse;
import com.github.logi.domain.essay.dto.response.EssayDetailResponse;
import com.github.logi.domain.essay.dto.response.EssayListResponse;
import com.github.logi.domain.essay.dto.response.EssayQuestionCreateResponse;
import com.github.logi.domain.essay.entity.Essay;
import com.github.logi.domain.essay.entity.EssayQuestion;
import com.github.logi.domain.essay.exception.EssayExceptions;
import com.github.logi.domain.essay.repository.EssayQuestionRepository;
import com.github.logi.domain.essay.repository.EssayRepository;
import com.github.logi.domain.experience.entity.Experience;
import com.github.logi.domain.experience.exception.ExperienceExceptions;
import com.github.logi.domain.experience.repository.ExperienceRepository;
import com.github.logi.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EssayService {

    private final EssayRepository essayRepository;
    private final EssayQuestionRepository essayQuestionRepository;
    private final ExperienceRepository experienceRepository;

    @Transactional
    public EssayCreateResponse createEssay(User user, EssayCreateRequest request) {
        Essay essay = Essay.create(user, request.companyName(), request.wishJob(), request.globalReq());
        return EssayCreateResponse.from(essayRepository.save(essay));
    }

    @Transactional
    public EssayQuestionCreateResponse createQuestion(User user, UUID essayId, EssayQuestionCreateRequest request) {
        Essay essay = essayRepository.findById(essayId)
                .orElseThrow(EssayExceptions.ESSAY_NOT_FOUND::toException);

        if (!essay.getUser().getId().equals(user.getId())) {
            throw EssayExceptions.FORBIDDEN_ESSAY.toException();
        }

        List<UUID> experienceIds = request.relatedExperience() == null ? List.of() :
                request.relatedExperience().stream()
                        .map(EssayQuestionCreateRequest.RelatedExperience::experienceId)
                        .toList();
        List<Experience> experiences = resolveExperiences(experienceIds);

        EssayQuestion question = EssayQuestion.create(essay, request.questionNum(), request.question(), request.response(), experiences);
        return EssayQuestionCreateResponse.from(essayQuestionRepository.save(question));
    }

    public EssayListResponse getEssays(User user) {
        return EssayListResponse.from(essayRepository.findAllByUser(user));
    }

    public EssayDetailResponse getEssay(User user, UUID essayId) {
        Essay essay = essayRepository.findByIdWithQuestions(essayId)
                .orElseThrow(EssayExceptions.ESSAY_NOT_FOUND::toException);

        if (!essay.getUser().getId().equals(user.getId())) {
            throw EssayExceptions.FORBIDDEN_ESSAY.toException();
        }

        return EssayDetailResponse.from(essay);
    }

    @Transactional
    public void updateEssay(User user, UUID essayId, EssayUpdateRequest request) {
        Essay essay = essayRepository.findById(essayId)
                .orElseThrow(EssayExceptions.ESSAY_NOT_FOUND::toException);

        if (!essay.getUser().getId().equals(user.getId())) {
            throw EssayExceptions.FORBIDDEN_ESSAY.toException();
        }

        essay.update(request.companyName(), request.wishJob(), request.globalReq());
    }

    @Transactional
    public void updateQuestion(User user, UUID essayId, UUID questionId, EssayQuestionUpdateRequest request) {
        EssayQuestion question = essayQuestionRepository.findByIdWithEssay(questionId)
                .orElseThrow(EssayExceptions.QUESTION_NOT_FOUND::toException);

        Essay essay = question.getEssay();

        if (!essay.getId().equals(essayId)) {
            throw EssayExceptions.QUESTION_ESSAY_MISMATCH.toException();
        }

        if (!essay.getUser().getId().equals(user.getId())) {
            throw EssayExceptions.FORBIDDEN_ESSAY.toException();
        }

        List<UUID> experienceIds = request.relatedExperience() == null ? List.of() :
                request.relatedExperience().stream()
                        .map(EssayQuestionUpdateRequest.RelatedExperience::experienceId)
                        .toList();
        List<Experience> experiences = resolveExperiences(experienceIds);

        question.update(request.question(), request.response(), experiences);
    }

    private List<Experience> resolveExperiences(List<UUID> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        List<Experience> experiences = experienceRepository.findAllById(ids);
        if (experiences.size() != ids.size()) {
            throw ExperienceExceptions.EXPERIENCE_NOT_FOUND.toException();
        }
        return experiences;
    }
}
