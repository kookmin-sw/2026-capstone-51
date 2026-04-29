package com.github.logi.domain.auth.exception;

import com.github.logi.global.exception.ApiExceptions;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum AuthExceptions implements ApiExceptions {

    NOT_KOOKMIN_EMAIL(HttpStatus.UNAUTHORIZED, "국민대학교 이메일이 아닙니다."),
    GOOGLE_TOKEN_EXCHANGE_FAILED(HttpStatus.UNAUTHORIZED, "구글 토큰 교환에 실패했습니다."),
    GOOGLE_USERINFO_FAILED(HttpStatus.UNAUTHORIZED, "구글 사용자 정보 조회에 실패했습니다."),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 리프레시 토큰입니다."),
    REFRESH_TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "리프레시 토큰을 찾을 수 없습니다."),
    REFRESH_TOKEN_REUSED(HttpStatus.UNAUTHORIZED, "이미 사용된 리프레시 토큰입니다. 다시 로그인해주세요."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
