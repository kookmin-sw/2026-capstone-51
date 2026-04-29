package com.github.logi.global.security.exception;

import com.github.logi.global.exception.ApiExceptions;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum SecurityExceptions implements ApiExceptions {

    ACCESS_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "엑세스 토큰이 만료 되었습니다."),
    INVALID_ACCESS_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 엑세스 토큰입니다."),
    USER_NOT_FOUND(HttpStatus.UNAUTHORIZED,"유저 정보를 찾을 수 없습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
