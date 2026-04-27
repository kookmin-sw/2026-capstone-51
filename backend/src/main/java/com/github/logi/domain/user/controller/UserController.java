package com.github.logi.domain.user.controller;

import com.github.logi.domain.user.dto.request.UserMeRequest;
import com.github.logi.domain.user.dto.response.UserMeResponse;
import com.github.logi.domain.user.entity.User;
import com.github.logi.domain.user.service.UserService;
import com.github.logi.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "User", description = "유저 API")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "내 정보 조회", description = "현재 로그인한 유저의 정보를 반환합니다.")
    @GetMapping("/me")
    public ApiResponse<UserMeResponse> getMe(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(userService.getMe(user));
    }

    @Operation(summary = "내 정보 수정", description = "현재 로그인한 유저의 정보를 수정합니다.")
    @PutMapping("/me")
    public ApiResponse<UserMeResponse> updateMe(
            @AuthenticationPrincipal User user,
            @RequestBody UserMeRequest request
    ) {
        return ApiResponse.ok(userService.updateMe(user, request));
    }
}
