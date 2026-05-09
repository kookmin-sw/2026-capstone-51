package com.github.logi.domain.essay.service;

import com.github.logi.domain.essay.dto.request.EssayCreateRequest;
import com.github.logi.domain.essay.dto.request.EssayGenerateRequest;
import com.github.logi.domain.essay.dto.request.EssayQuestionCreateRequest;
import com.github.logi.domain.essay.dto.request.EssayQuestionUpdateRequest;
import com.github.logi.domain.essay.dto.request.EssayRecommendRequest;
import com.github.logi.domain.essay.dto.request.EssayResultUpdateRequest;
import com.github.logi.domain.essay.dto.request.EssayUpdateRequest;
import com.github.logi.domain.essay.dto.response.EssayCreateResponse;
import com.github.logi.domain.essay.dto.response.EssayDetailResponse;
import com.github.logi.domain.essay.dto.response.EssayGenerateResponse;
import com.github.logi.domain.essay.dto.response.EssayListResponse;
import com.github.logi.domain.essay.dto.response.EssayQuestionCreateResponse;
import com.github.logi.domain.essay.dto.response.EssayRecommendResponse;
import com.github.logi.domain.essay.entity.Essay;
import com.github.logi.domain.essay.entity.EssayQuestion;
import com.github.logi.domain.essay.exception.EssayExceptions;
import com.github.logi.domain.essay.repository.EssayQuestionRepository;
import com.github.logi.domain.essay.repository.EssayRepository;
import com.github.logi.domain.experience.entity.Experience;
import com.github.logi.domain.experience.exception.ExperienceExceptions;
import com.github.logi.domain.experience.repository.ExperienceRepository;
import com.github.logi.domain.user.entity.User;
import com.github.logi.global.embedding.EmbeddingClient;
import com.github.logi.global.llm.LlmClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EssayService {

    private static final int RECOMMEND_LIMIT = 5;

    private final EssayRepository essayRepository;
    private final EssayQuestionRepository essayQuestionRepository;
    private final ExperienceRepository experienceRepository;
    private final EmbeddingClient embeddingClient;
    private final LlmClient llmClient;
    private final EssayPromptBuilder essayPromptBuilder;

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

        EssayQuestion question = EssayQuestion.create(essay, request.questionNum(), request.question(), request.response(), request.maxLength(), experiences);
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
    public void deleteEssay(User user, UUID essayId) {
        Essay essay = essayRepository.findById(essayId)
                .orElseThrow(EssayExceptions.ESSAY_NOT_FOUND::toException);

        if (!essay.getUser().getId().equals(user.getId())) {
            throw EssayExceptions.FORBIDDEN_ESSAY.toException();
        }

        essayRepository.delete(essay);
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

        question.update(request.question(), request.response(), request.maxLength(), experiences);
    }

    @Transactional
    public void updateResult(User user, UUID essayId, EssayResultUpdateRequest request) {
        Essay essay = essayRepository.findById(essayId)
                .orElseThrow(EssayExceptions.ESSAY_NOT_FOUND::toException);

        if (!essay.getUser().getId().equals(user.getId())) {
            throw EssayExceptions.FORBIDDEN_ESSAY.toException();
        }

        essay.updateProgress(request.progress());
    }

    public EssayGenerateResponse generateResponse(User user, EssayGenerateRequest request) {
        EssayQuestion question = essayQuestionRepository
                .findByIdWithEssayAndExperiences(request.questionId())
                .orElseThrow(EssayExceptions.QUESTION_NOT_FOUND::toException);

        Essay essay = question.getEssay();

        if (!essay.getId().equals(request.essayId())) {
            throw EssayExceptions.QUESTION_ESSAY_MISMATCH.toException();
        }

        if (!essay.getUser().getId().equals(user.getId())) {
            throw EssayExceptions.FORBIDDEN_ESSAY.toException();
        }

        EssayPromptBuilder.GeneratePrompt prompt = essayPromptBuilder.buildGeneratePrompt(
                essay, question, question.getExperiences());
        String generated = llmClient.invoke(prompt.system(), prompt.user());

        return new EssayGenerateResponse(generated);
    }

    public EssayRecommendResponse recommendExperiences(User user, EssayRecommendRequest request) {
        float[] questionEmbedding = embeddingClient.embed(request.question());
        String embeddingLiteral = toVectorLiteral(questionEmbedding);

        List<ExperienceRepository.RecommendedExperienceView> rows =
                experienceRepository.findRecommendedByEmbedding(
                        user.getId(), embeddingLiteral, RECOMMEND_LIMIT);

        List<EssayRecommendResponse.RelatedExperience> related = rows.stream()
                .map(view -> new EssayRecommendResponse.RelatedExperience(
                        view.getId(),
                        view.getExperienceTitle(),
                        1.0 - view.getDistance()
                ))
                .toList();

        return new EssayRecommendResponse(related);
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

    private String toVectorLiteral(float[] embedding) {
        StringBuilder sb = new StringBuilder(embedding.length * 8);
        sb.append('[');
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(embedding[i]);
        }
        sb.append(']');
        return sb.toString();
    }
}
