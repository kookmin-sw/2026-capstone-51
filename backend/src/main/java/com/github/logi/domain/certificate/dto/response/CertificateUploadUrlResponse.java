package com.github.logi.domain.certificate.dto.response;

public record CertificateUploadUrlResponse(
        String uploadUrl,
        String fileKey,
        String contentType
) {
}
