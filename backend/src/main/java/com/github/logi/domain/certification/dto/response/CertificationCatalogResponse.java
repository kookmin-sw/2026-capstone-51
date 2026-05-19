package com.github.logi.domain.certification.dto.response;

import com.github.logi.domain.certification.entity.CertificationCatalog;
import com.github.logi.domain.certification.entity.Difficulty;

import java.util.UUID;

public record CertificationCatalogResponse(
        UUID certificationCatalogId,
        String name,
        String issuingOrganization,
        Difficulty difficulty
) {
    public static CertificationCatalogResponse from(CertificationCatalog catalog) {
        return new CertificationCatalogResponse(
                catalog.getId(),
                catalog.getName(),
                catalog.getIssuingOrganization(),
                catalog.getDifficulty()
        );
    }
}