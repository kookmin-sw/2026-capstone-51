package com.github.logi.global.llm.exception;

import com.github.logi.global.exception.ApiExceptions;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum LlmExceptions implements ApiExceptions {

    LLM_GENERATION_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "응답 생성 서비스 호출에 실패했습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
