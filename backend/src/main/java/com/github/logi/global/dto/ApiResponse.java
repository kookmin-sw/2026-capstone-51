package com.github.logi.global.dto;

import com.github.logi.global.exception.ApiException;
import org.springframework.http.HttpStatus;

public record ApiResponse<T>(
        int statusCode,
        String message,
        T data
) {
    public static ApiResponse<Void> ok() {
        return new ApiResponse<>(200, null, null);
    }

    public static <T> ApiResponse<T> ok(T content) {
        return new ApiResponse<>(200, null, content);
    }

    public static <T> ApiResponse<T> error(ApiException e) {
        return error(e.getStatus(), e.getMessage());
    }

    public static <T> ApiResponse<T> error(HttpStatus status, String error) {
        return new ApiResponse<>(status.value(), error, null);
    }
}
