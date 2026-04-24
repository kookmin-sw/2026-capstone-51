package com.github.logi.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {
    private final HttpStatus status;

    public ApiException(HttpStatus httpStatus, String message) {
        super(message);
        this.status = httpStatus;
    }

    public ApiException(ApiExceptions e) {

        super(e.getMessage());
        this.status = e.getHttpStatus();
    }
}
