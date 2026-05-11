package com.github.logi.domain.certificate.dto.response;

import com.github.logi.domain.certificate.entity.Certificate;

import java.util.List;
import java.util.function.Function;

public record CertificateListResponse(
        List<CertificateResponse> certificates
) {
    public static CertificateListResponse from(
            List<Certificate> certificates,
            Function<String, String> fileKeyToUrl
    ) {
        return new CertificateListResponse(
                certificates.stream()
                        .map(certificate -> CertificateResponse.from(
                                certificate,
                                certificate.getFileKey() == null
                                        ? null
                                        : fileKeyToUrl.apply(certificate.getFileKey())
                        ))
                        .toList()
        );
    }
}
