package com.github.logi.domain.essay.controller;

import com.github.logi.domain.essay.dto.request.EssayCreateRequest;
import com.github.logi.domain.essay.dto.response.EssayCreateResponse;
import com.github.logi.domain.essay.dto.response.EssayDetailResponse;
import com.github.logi.domain.essay.dto.response.EssayListResponse;
import com.github.logi.domain.essay.service.EssayService;
import com.github.logi.domain.user.entity.User;
import com.github.logi.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Essay", description = "자소서 API")
@RestController
@RequestMapping("/essays")
@RequiredArgsConstructor
public class EssayController {

    private final EssayService essayService;

    @Operation(summary = "자소서 생성", description = "새 자소서를 생성하고 essayId를 반환합니다.")
    @PostMapping("/create")
    public ApiResponse<EssayCreateResponse> createEssay(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody EssayCreateRequest request
    ) {
        return ApiResponse.ok(essayService.createEssay(user, request));
    }

    @Operation(summary = "내 자소서 목록 조회", description = "사용자의 자소서 목록을 회사명, 희망 직무, 진행 상태, 최종 수정 일시와 함께 조회합니다.")
    @GetMapping
    public ApiResponse<EssayListResponse> getEssays(
            @AuthenticationPrincipal User user
    ) {
        return ApiResponse.ok(essayService.getEssays(user));
    }

    @Operation(summary = "자소서 상세 조회", description = "자소서 상세 정보(회사명, 공통 요구사항, 문항 목록, 희망 직무, 진행 상태, 최종 수정 일자)를 조회합니다.")
    @GetMapping("/{essayId}")
    public ApiResponse<EssayDetailResponse> getEssay(
            @AuthenticationPrincipal User user,
            @PathVariable UUID essayId
    ) {
        return ApiResponse.ok(essayService.getEssay(user, essayId));
    }
}
