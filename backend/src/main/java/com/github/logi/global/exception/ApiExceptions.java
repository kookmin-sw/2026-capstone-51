package com.github.logi.global.exception;

import org.springframework.http.HttpStatus;

public interface ApiExceptions {

    HttpStatus getHttpStatus();
    String getMessage();

    default ApiException toException() {
        return new ApiException(this);
    }
}
