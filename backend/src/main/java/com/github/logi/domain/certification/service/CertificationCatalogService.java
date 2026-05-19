package com.github.logi.domain.certification.service;

import com.github.logi.domain.certification.dto.response.CertificationCatalogResponse;
import com.github.logi.domain.certification.repository.CertificationCatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificationCatalogService {

    private final CertificationCatalogRepository certificationCatalogRepository;

    public List<CertificationCatalogResponse> getCatalogList() {
        return certificationCatalogRepository.findAll()
                .stream()
                .map(CertificationCatalogResponse::from)
                .toList();
    }
}