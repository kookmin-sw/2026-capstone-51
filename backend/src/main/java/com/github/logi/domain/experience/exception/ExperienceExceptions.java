package com.github.logi.domain.experience.exception;

import com.github.logi.global.exception.ApiExceptions;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ExperienceExceptions implements ApiExceptions {
    EXPERIENCE_NOT_FOUND(HttpStatus.NOT_FOUND, "경험을 찾을 수 없습니다."),
    FORBIDDEN_EXPERIENCE(HttpStatus.FORBIDDEN, "본인의 경험이 아닙니다."),
    INVALID_DATE_RANGE(HttpStatus.BAD_REQUEST, "종료일은 시작일보다 빠를 수 없습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
