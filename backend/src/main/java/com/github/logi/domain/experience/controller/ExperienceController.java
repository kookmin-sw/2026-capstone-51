package com.github.logi.domain.experience.controller;

import com.github.logi.domain.experience.dto.request.ExperienceRequest;
import com.github.logi.domain.experience.dto.response.ExperienceListResponse;
import com.github.logi.domain.experience.dto.response.ExperienceResponse;
import com.github.logi.domain.experience.service.ExperienceService;
import com.github.logi.domain.user.entity.User;
import com.github.logi.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "Experience", description = "경험 API")
@RestController
@RequestMapping("/experiences")
@RequiredArgsConstructor
public class ExperienceController {

    private final ExperienceService experienceService;

    @Operation(summary = "경험 저장", description = "STAR 구조의 경험을 저장합니다.")
    @PostMapping
    public ApiResponse<Void> createExperience(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ExperienceRequest request
    ) {
        experienceService.createExperience(user, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "내 경험 목록 조회", description = "사용자의 경험 목록을 조회합니다.")
    @GetMapping
    public ApiResponse<ExperienceListResponse> getExperiences(
            @AuthenticationPrincipal User user
    ) {
        return ApiResponse.ok(experienceService.getExperiences(user));
    }

    @Operation(summary = "경험 상세 조회", description = "경험 상세 정보를 조회합니다.")
    @GetMapping("/{experienceId}")
    public ApiResponse<ExperienceResponse> getExperience(
            @AuthenticationPrincipal User user,
            @PathVariable UUID experienceId
    ) {
        return ApiResponse.ok(experienceService.getExperience(user, experienceId));
    }

    @Operation(summary = "경험 수정", description = "경험을 수정합니다.")
    @PutMapping("/{experienceId}")
    public ApiResponse<Void> updateExperience(
            @AuthenticationPrincipal User user,
            @PathVariable UUID experienceId,
            @Valid @RequestBody ExperienceRequest request
    ) {
        experienceService.updateExperience(user, experienceId, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "경험 삭제", description = "경험을 소프트 삭제합니다.")
    @DeleteMapping("/{experienceId}")
    public ApiResponse<Void> deleteExperience(
            @AuthenticationPrincipal User user,
            @PathVariable UUID experienceId
    ) {
        experienceService.deleteExperience(user, experienceId);
        return ApiResponse.ok();
    }
}
