package com.github.logi.domain.certification.repository;

import com.github.logi.domain.certification.entity.CertificationCatalog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CertificationCatalogRepository extends JpaRepository<CertificationCatalog, UUID> {
    Optional<CertificationCatalog> findByName(String name);
}