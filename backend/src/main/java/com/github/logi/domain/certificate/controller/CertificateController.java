package com.github.logi.domain.certificate.controller;

import com.github.logi.domain.certificate.dto.request.CertificateRequest;
import com.github.logi.domain.certificate.dto.response.CertificateListResponse;
import com.github.logi.domain.certificate.dto.response.CertificateUploadUrlResponse;
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

    @Operation(summary = "자격증 증빙자료 업로드 URL 발급",
            description = "PDF 파일 업로드용 presigned PUT URL을 발급합니다. 클라이언트는 받은 URL로 Content-Type: application/pdf 헤더와 함께 PUT 요청을 보내 파일을 업로드한 뒤, 응답의 fileKey를 자격증 등록/수정 요청에 첨부합니다.")
    @PostMapping("/upload-url")
    public ApiResponse<CertificateUploadUrlResponse> issueUploadUrl(
            @AuthenticationPrincipal User user) {
        return ApiResponse.ok(certificateService.issueUploadUrl(user));
    }

    @Operation(summary = "자격증 등록", description = "자격증을 등록합니다. fileKey가 있으면 증빙 PDF가 함께 등록됩니다.")
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

    @Operation(summary = "자격증 수정", description = "자격증을 수정합니다. fileKey가 바뀌면 이전 파일은 S3에서 삭제됩니다.")
    @PutMapping("/{certificateId}")
    public ApiResponse<Void> updateCertificate(
            @AuthenticationPrincipal User user,
            @PathVariable UUID certificateId,
            @RequestBody CertificateRequest request) {
        certificateService.updateCertificate(user, certificateId, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "자격증 삭제", description = "자격증을 삭제하고 증빙 파일이 있으면 S3에서도 함께 삭제합니다.")
    @DeleteMapping("/{certificateId}")
    public ApiResponse<Void> deleteCertificate(
            @AuthenticationPrincipal User user,
            @PathVariable UUID certificateId) {
        certificateService.deleteCertificate(user, certificateId);
        return ApiResponse.ok();
    }
}
