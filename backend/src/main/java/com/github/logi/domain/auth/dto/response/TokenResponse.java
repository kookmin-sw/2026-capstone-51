package com.github.logi.domain.auth.dto.response;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        boolean firstLogin
) {
}
