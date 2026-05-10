package com.github.logi.domain.certificate.service;

import com.github.logi.domain.certificate.dto.request.CertificateRequest;
import com.github.logi.domain.certificate.dto.response.CertificateListResponse;
import com.github.logi.domain.certificate.entity.Certificate;
import com.github.logi.domain.certificate.exception.CertificateExceptions;
import com.github.logi.domain.certificate.repository.CertificateRepository;
import com.github.logi.domain.user.entity.User;
import com.github.logi.global.config.CacheConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificateService {

    private final CertificateRepository certificateRepository;

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.USER_STATS_CACHE, allEntries = true)
    public void createCertificate(User user, CertificateRequest request) {
        certificateRepository.save(Certificate.create(user, request));
    }

    public CertificateListResponse getCertificates(User user){
        return CertificateListResponse.from(certificateRepository.findAllByUser(user));
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.USER_STATS_CACHE, allEntries = true)
    public void updateCertificate(User user, UUID certificateId, CertificateRequest request) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(CertificateExceptions.CERTIFICATE_NOT_FOUND::toException);

        if (!certificate.getUser().getId().equals(user.getId())) {
            throw CertificateExceptions.FORBIDDEN_CERTIFICATE.toException();
        }

        certificate.update(request);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.USER_STATS_CACHE, allEntries = true)
    public void deleteCertificate(User user, UUID certificateId) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(CertificateExceptions.CERTIFICATE_NOT_FOUND::toException);

        if (!certificate.getUser().getId().equals(user.getId())) {
            throw CertificateExceptions.FORBIDDEN_CERTIFICATE.toException();
        }

        certificateRepository.delete(certificate);
    }
}
