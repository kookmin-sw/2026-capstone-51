package com.github.logi.domain.certificate.dto.response;

import com.github.logi.domain.certificate.entity.Certificate;

import java.util.List;

public record CertificateListResponse(
        List<CertificateResponse> certificates
) {
    public static CertificateListResponse from(List<Certificate> certificates) {
        return new CertificateListResponse(
                certificates.stream()
                        .map(CertificateResponse::from)
                        .toList()
        );
    }
}
