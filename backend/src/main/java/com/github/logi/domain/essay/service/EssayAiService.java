package com.github.logi.domain.essay.service;

import com.github.logi.domain.essay.dto.request.EssayGenerateRequest;
import com.github.logi.domain.essay.dto.request.EssayRecommendRequest;
import com.github.logi.domain.essay.dto.request.EssayRegenerateRequest;
import com.github.logi.domain.essay.dto.response.EssayGenerateResponse;
import com.github.logi.domain.essay.dto.response.EssayRecommendResponse;
import com.github.logi.domain.essay.entity.Essay;
import com.github.logi.domain.essay.entity.EssayQuestion;
import com.github.logi.domain.essay.exception.EssayExceptions;
import com.github.logi.domain.essay.repository.EssayQuestionRepository;
import com.github.logi.domain.experience.repository.ExperienceRepository;
import com.github.logi.domain.user.entity.User;
import com.github.logi.global.embedding.EmbeddingClient;
import com.github.logi.global.llm.LlmClient;
import com.github.logi.global.util.VectorLiterals;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EssayAiService {

    private static final int RECOMMEND_LIMIT = 5;
    private static final double SIMILARITY_SHARPNESS = 10.0;

    private final EssayQuestionRepository essayQuestionRepository;
    private final ExperienceRepository experienceRepository;
    private final EmbeddingClient embeddingClient;
    private final LlmClient llmClient;
    private final EssayPromptBuilder essayPromptBuilder;

    public EssayGenerateResponse generateResponse(User user, EssayGenerateRequest request) {
        EssayQuestion question = loadAndAuthorizeQuestion(
                request.essayId(), request.questionId(), user.getId());

        EssayPromptBuilder.Prompt prompt = essayPromptBuilder.buildGeneratePrompt(
                question.getEssay(), question, question.getExperiences());
        String generated = llmClient.invoke(prompt.system(), prompt.user());

        return new EssayGenerateResponse(generated);
    }

    public EssayGenerateResponse regenerateResponse(User user, EssayRegenerateRequest request) {
        EssayQuestion question = loadAndAuthorizeQuestion(
                request.essayId(), request.questionId(), user.getId());

        EssayPromptBuilder.Prompt prompt = essayPromptBuilder.buildRegeneratePrompt(
                question.getEssay(), question, question.getExperiences(),
                request.currentResponse(), request.questionReq());
        String generated = llmClient.invoke(prompt.system(), prompt.user());

        return new EssayGenerateResponse(generated);
    }

    public EssayRecommendResponse recommendExperiences(User user, EssayRecommendRequest request) {
        float[] questionEmbedding = embeddingClient.embed(request.question());
        String embeddingLiteral = VectorLiterals.toLiteral(questionEmbedding);

        List<ExperienceRepository.RecommendedExperienceView> rows =
                experienceRepository.findRecommendedByEmbedding(
                        user.getId(), embeddingLiteral, RECOMMEND_LIMIT);

        List<EssayRecommendResponse.RelatedExperience> related = rows.stream()
                .map(view -> new EssayRecommendResponse.RelatedExperience(
                        view.getId(),
                        view.getExperienceTitle(),
                        toSimilarityScore(view.getDistance())
                ))
                .toList();

        return new EssayRecommendResponse(related);
    }

    private double toSimilarityScore(double distance) {
        double raw = Math.max(0.0, 1.0 - distance);
        return 1.0 - Math.exp(-SIMILARITY_SHARPNESS * raw);
    }

    private EssayQuestion loadAndAuthorizeQuestion(UUID essayId, UUID questionId, UUID userId) {
        EssayQuestion question = essayQuestionRepository
                .findByIdWithEssayAndExperiences(questionId)
                .orElseThrow(EssayExceptions.QUESTION_NOT_FOUND::toException);

        Essay essay = question.getEssay();

        if (!essay.getId().equals(essayId)) {
            throw EssayExceptions.QUESTION_ESSAY_MISMATCH.toException();
        }

        if (!essay.getUser().getId().equals(userId)) {
            throw EssayExceptions.FORBIDDEN_ESSAY.toException();
        }

        return question;
    }
}
