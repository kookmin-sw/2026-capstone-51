package com.github.logi.global.storage.exception;

import com.github.logi.global.exception.ApiExceptions;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum StorageExceptions implements ApiExceptions {
    UPLOAD_URL_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "업로드 URL 발급에 실패했습니다."),
    DOWNLOAD_URL_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "다운로드 URL 발급에 실패했습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
