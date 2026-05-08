package com.github.logi.global.embedding.exception;

import com.github.logi.global.exception.ApiExceptions;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum EmbeddingExceptions implements ApiExceptions {

    EMBEDDING_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "임베딩 서비스 호출에 실패했습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
