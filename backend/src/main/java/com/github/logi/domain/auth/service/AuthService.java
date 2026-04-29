package com.github.logi.domain.auth.service;

import com.github.logi.domain.auth.client.GoogleOAuthClient;
import com.github.logi.domain.auth.dto.google.GoogleUserInfoResponse;
import com.github.logi.domain.auth.dto.request.LoginRequest;
import com.github.logi.domain.auth.dto.request.LogoutRequest;
import com.github.logi.domain.auth.dto.request.ReissueRequest;
import com.github.logi.domain.auth.dto.response.TokenResponse;
import com.github.logi.domain.auth.entity.RefreshToken;
import com.github.logi.domain.auth.exception.AuthExceptions;
import com.github.logi.domain.auth.repository.RefreshTokenRepository;
import com.github.logi.domain.certificate.repository.CertificateRepository;
import com.github.logi.domain.user.entity.User;
import com.github.logi.domain.user.repository.UserRepository;
import com.github.logi.global.security.jwt.JwtUtil;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private static final String KOOKMIN_EMAIL_DOMAIN = "@kookmin.ac.kr";

    private final GoogleOAuthClient googleOAuthClient;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final CertificateRepository certificateRepository;
    private final JwtUtil jwtUtil;

    @Transactional
    public TokenResponse login(LoginRequest request) {

        String googleAccessToken = googleOAuthClient.getAccessToken(request.grantCode());
        GoogleUserInfoResponse userInfo = googleOAuthClient.getUserInfo(googleAccessToken);

        if (userInfo.email() == null) {
            throw AuthExceptions.GOOGLE_USERINFO_FAILED.toException();
        }

        String email = userInfo.email().toLowerCase();

        if (!email.endsWith(KOOKMIN_EMAIL_DOMAIN)) {
            throw AuthExceptions.NOT_KOOKMIN_EMAIL.toException();
        }

        String name = userInfo.name() != null ? userInfo.name() : "";

        Optional<User> existing = userRepository.findByEmail(email);
        boolean firstLogin = existing.isEmpty();
        User user = existing.orElseGet(() -> userRepository.save(User.create(email, name)));

        refreshTokenRepository.deleteAllByUserId(user.getId());

        return issueTokens(user, firstLogin);
    }

    @Transactional
    public void logout(User user, LogoutRequest request) {

        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(AuthExceptions.REFRESH_TOKEN_NOT_FOUND::toException);

        if (!refreshToken.getUserId().equals(user.getId())) {
            throw AuthExceptions.INVALID_REFRESH_TOKEN.toException();
        }

        refreshToken.revoke();
    }

    @Transactional
    public TokenResponse reissue(ReissueRequest request) {

        String token = request.refreshToken();

        if (!jwtUtil.validateToken(token) || !jwtUtil.isRefreshToken(token)) {
            throw AuthExceptions.INVALID_REFRESH_TOKEN.toException();
        }

        RefreshToken stored = refreshTokenRepository.findByToken(token)
                .orElseThrow(AuthExceptions.REFRESH_TOKEN_NOT_FOUND::toException);

        if (stored.isRevoked()) {
            refreshTokenRepository.revokeAllByUserId(stored.getUserId());
            throw AuthExceptions.REFRESH_TOKEN_REUSED.toException();
        }

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(AuthExceptions.USER_NOT_FOUND::toException);

        stored.revoke();

        return issueTokens(user, false);
    }

    @Transactional
    public void withdraw(User user) {

        if (!userRepository.existsById(user.getId())) {
            throw AuthExceptions.USER_NOT_FOUND.toException();
        }

        certificateRepository.deleteAllByUser(user);
        refreshTokenRepository.deleteAllByUserId(user.getId());
        userRepository.deleteById(user.getId());
    }

    private TokenResponse issueTokens(User user, boolean firstLogin) {

        String accessToken = jwtUtil.generateAccessToken(user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        refreshTokenRepository.save(
                RefreshToken.create(user.getId(), refreshToken, jwtUtil.getRefreshTokenExpiresAt())
        );

        return new TokenResponse(accessToken, refreshToken, firstLogin);
    }
}
