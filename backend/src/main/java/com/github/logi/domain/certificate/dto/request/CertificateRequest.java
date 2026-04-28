package com.github.logi.domain.certificate.dto.request;

public record CertificateRequest(
        String certificateName,
        String getDate,
        String expirationDate,
        String certificateCode,
        String issuingOrganization
) {
}
