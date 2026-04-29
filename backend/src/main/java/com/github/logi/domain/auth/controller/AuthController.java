package com.github.logi.domain.auth.controller;

import com.github.logi.domain.auth.dto.request.LoginRequest;
import com.github.logi.domain.auth.dto.request.LogoutRequest;
import com.github.logi.domain.auth.dto.request.ReissueRequest;
import com.github.logi.domain.auth.dto.response.TokenResponse;
import com.github.logi.domain.auth.service.AuthService;
import com.github.logi.domain.user.entity.User;
import com.github.logi.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Auth", description = "인증 API")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "구글 로그인", description = "구글 grant code로 로그인합니다. 국민대 계정만 허용됩니다.")
    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @Operation(summary = "토큰 재발급", description = "리프레시 토큰으로 새 access/refresh 토큰을 발급합니다.")
    @PostMapping("/reissue")
    public ApiResponse<TokenResponse> reissue(@Valid @RequestBody ReissueRequest request) {
        return ApiResponse.ok(authService.reissue(request));
    }

    @Operation(summary = "로그아웃", description = "리프레시 토큰을 폐기합니다.")
    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody LogoutRequest request
    ) {
        authService.logout(user, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "회원 탈퇴", description = "현재 로그인한 사용자를 탈퇴 처리합니다.")
    @PostMapping("/withdraw")
    public ApiResponse<Void> withdraw(@AuthenticationPrincipal User user) {
        authService.withdraw(user);
        return ApiResponse.ok();
    }
}
