package com.github.logi.domain.certificate.dto.response;

import com.github.logi.domain.certificate.entity.Certificate;

import java.util.UUID;

public record CertificateResponse(
        UUID certificateId,
        String certificateName,
        String getDate,
        String expirationDate,
        String certificateCode,
        String issuingOrganization,
        String fileUrl
) {
    public static CertificateResponse from(Certificate certificate, String fileUrl) {
        return new CertificateResponse(
                certificate.getId(),
                certificate.getCertificateName(),
                certificate.getGetDate(),
                certificate.getExpirationDate(),
                certificate.getCertificateCode(),
                certificate.getIssuingOrganization(),
                fileUrl
        );
    }
}
