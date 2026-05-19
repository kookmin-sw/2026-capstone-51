package com.github.logi.domain.certification.entity;

import com.github.logi.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "certification_catalog")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CertificationCatalog extends BaseEntity {

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "issuing_organization", length = 150)
    private String issuingOrganization;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", length = 10)
    private Difficulty difficulty;

}