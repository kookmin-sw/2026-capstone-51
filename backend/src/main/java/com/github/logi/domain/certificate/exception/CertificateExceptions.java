package com.github.logi.domain.certificate.exception;

import com.github.logi.global.exception.ApiExceptions;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum CertificateExceptions implements ApiExceptions {
    CERTIFICATE_NOT_FOUND(HttpStatus.NOT_FOUND, "자격증을 찾을 수 없습니다."),
    FORBIDDEN_CERTIFICATE(HttpStatus.FORBIDDEN, "본인의 자격증이 아닙니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
