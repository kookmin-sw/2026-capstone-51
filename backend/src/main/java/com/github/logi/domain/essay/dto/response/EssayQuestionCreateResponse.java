package com.github.logi.domain.essay.dto.response;

import com.github.logi.domain.essay.entity.EssayQuestion;

import java.util.UUID;

public record EssayQuestionCreateResponse(UUID questionId) {

    public static EssayQuestionCreateResponse from(EssayQuestion question) {
        return new EssayQuestionCreateResponse(question.getId());
    }
}
