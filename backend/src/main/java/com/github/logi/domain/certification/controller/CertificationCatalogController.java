package com.github.logi.domain.certification.controller;

import com.github.logi.domain.certification.dto.response.CertificationCatalogResponse;
import com.github.logi.domain.certification.service.CertificationCatalogService;
import com.github.logi.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "CertificationCatalog", description = "자격증 목록 API")
@RestController
@RequestMapping("/api/certification-catalog")
@RequiredArgsConstructor
public class CertificationCatalogController {

    private final CertificationCatalogService certificationCatalogService;

    @Operation(summary = "자격증 목록 조회",
            description = "자격증 목록을 조회합니다.")
    @GetMapping
    public ApiResponse<List<CertificationCatalogResponse>> getCatalogList() {
        return ApiResponse.ok(certificationCatalogService.getCatalogList());
    }
}