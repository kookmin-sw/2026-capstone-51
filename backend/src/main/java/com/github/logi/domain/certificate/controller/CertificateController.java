package com.github.logi.domain.certificate.controller;

import com.github.logi.domain.certificate.dto.request.CertificateRequest;
import com.github.logi.domain.certificate.dto.response.CertificateListResponse;
import com.github.logi.domain.certificate.service.CertificateService;
import com.github.logi.domain.user.entity.User;
import com.github.logi.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Certificate", description = "자격증 API")
@RestController
@RequestMapping("/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @Operation(summary = "자격증 등록", description = "자격증을 등록합니다.")
    @PostMapping
    public ApiResponse<Void> createCertificate(
            @AuthenticationPrincipal User user,
            @RequestBody CertificateRequest request) {
        certificateService.createCertificate(user, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "자격증 목록 조회", description = "자격증 목록을 조회합니다.")
    @GetMapping
    public ApiResponse<CertificateListResponse> getCertificates(
            @AuthenticationPrincipal User user) {
        return ApiResponse.ok(certificateService.getCertificates(user));
    }

    @Operation(summary = "자격증 수정", description = "자격증을 수정합니다.")
    @PutMapping("/{certificateId}")
    public ApiResponse<Void> updateCertificate(
            @AuthenticationPrincipal User user,
            @PathVariable UUID certificateId,
            @RequestBody CertificateRequest request) {
        certificateService.updateCertificate(user, certificateId, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "자격증 삭제", description = "자격증을 삭제합니다.")
    @DeleteMapping("/{certificateId}")
    public ApiResponse<Void> deleteCertificate(
            @AuthenticationPrincipal User user,
            @PathVariable UUID certificateId) {
        certificateService.deleteCertificate(user, certificateId);
        return ApiResponse.ok();
    }
}

