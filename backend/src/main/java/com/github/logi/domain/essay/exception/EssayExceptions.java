package com.github.logi.domain.essay.exception;

import com.github.logi.global.exception.ApiExceptions;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum EssayExceptions implements ApiExceptions {
    ESSAY_NOT_FOUND(HttpStatus.NOT_FOUND, "자소서를 찾을 수 없습니다."),
    FORBIDDEN_ESSAY(HttpStatus.FORBIDDEN, "본인의 자소서가 아닙니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
