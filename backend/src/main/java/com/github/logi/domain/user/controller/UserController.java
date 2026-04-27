package com.github.logi.domain.user.controller;

import com.github.logi.domain.user.dto.request.UserMeRequest;
import com.github.logi.domain.user.dto.response.UserMeResponse;
import com.github.logi.domain.user.entity.User;
import com.github.logi.domain.user.service.UserService;
import com.github.logi.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<UserMeResponse> getMe(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(userService.getMe(user));
    }

    @PutMapping("/me")
    public ApiResponse<UserMeResponse> updateMe(
            @AuthenticationPrincipal User user,
            @RequestBody UserMeRequest request
    ) {
        return ApiResponse.ok(userService.updateMe(user, request));
    }
}
