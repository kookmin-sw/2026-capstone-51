package com.github.logi.domain.user.controller;

import com.github.logi.domain.user.dto.request.UserMeRequest;
import com.github.logi.domain.user.dto.response.DashboardResponse;
import com.github.logi.domain.user.dto.response.UserMeResponse;
import com.github.logi.domain.user.dto.response.UserStatsResponse;
import com.github.logi.domain.user.entity.GroupBy;
import com.github.logi.domain.user.entity.User;
import com.github.logi.domain.user.service.DashboardService;
import com.github.logi.domain.user.service.UserService;
import com.github.logi.domain.user.service.UserStatsService;
import com.github.logi.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "User", description = "유저 API")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserStatsService userStatsService;
    private final DashboardService dashboardService;

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

    @Operation(
            summary = "내 통계 조회",
            description = """
                    현재 로그인한 유저의 경험·자격증 통계와 부족한 점(약점)을 반환합니다.
                    groupBy 파라미터로 비교 대상을 지정합니다.
                    - STATE: 동일 학과 + 동일 학년(State) 기준
                    - SCHOOL_NUM: 동일 학과 + 동일 입학연도(학번 앞 2자리) 기준
                    - WORKER: 동일 학과 합격자(WORKER) 기준
                    """
    )
    @GetMapping("/me/stats")
    public ApiResponse<UserStatsResponse> getStats(
            @AuthenticationPrincipal User user,
            @RequestParam GroupBy groupBy
    ) {
        return ApiResponse.ok(userStatsService.getStats(user, groupBy));
    }

    @Operation(
            summary = "메인 대시보드 조회",
            description = """
                    현재 로그인한 유저의 메인 화면 데이터를 반환합니다.
                    - statistics: 동일 학과 + 동일 학년(STATE) 기준 경험·자격증 평균 및 내 현황
                    - userExperiences: 내 경험·자격증 목록
                    - graduateUserExperiences: 동일 학과 + 희망 직무(jobFirst) 겹치는 합격자(WORKER) 최신 2명의 경험·자격증
                    """
    )
    @GetMapping("/me/dashboard")
    public ApiResponse<DashboardResponse> getDashboard(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(dashboardService.getDashboard(user));
    }
}
