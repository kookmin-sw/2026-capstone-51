package com.github.logi.domain.certificate.service;

import com.github.logi.domain.certificate.dto.request.CertificateRequest;
import com.github.logi.domain.certificate.dto.response.CertificateListResponse;
import com.github.logi.domain.certificate.dto.response.CertificateUploadUrlResponse;
import com.github.logi.domain.certificate.entity.Certificate;
import com.github.logi.domain.certificate.exception.CertificateExceptions;
import com.github.logi.domain.certificate.repository.CertificateRepository;
import com.github.logi.domain.user.entity.User;
import com.github.logi.global.config.CacheConfig;
import com.github.logi.global.storage.S3FileClient;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificateService {

    private static final String PDF_CONTENT_TYPE = "application/pdf";
    private static final String CERTIFICATE_KEY_PREFIX = "certificates/";

    private final CertificateRepository certificateRepository;
    private final S3FileClient s3FileClient;

    public CertificateUploadUrlResponse issueUploadUrl(User user) {
        String fileKey = CERTIFICATE_KEY_PREFIX + user.getId() + "/" + UUID.randomUUID() + ".pdf";
        String uploadUrl = s3FileClient.generateUploadUrl(fileKey, PDF_CONTENT_TYPE);
        return new CertificateUploadUrlResponse(uploadUrl, fileKey, PDF_CONTENT_TYPE);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.USER_STATS_CACHE, allEntries = true)
    public void createCertificate(User user, CertificateRequest request) {
        verifyFileKeyOwnership(user, request.fileKey());
        certificateRepository.save(Certificate.create(user, request));
    }

    public CertificateListResponse getCertificates(User user) {
        return CertificateListResponse.from(
                certificateRepository.findAllByUser(user),
                s3FileClient::generateDownloadUrl
        );
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.USER_STATS_CACHE, allEntries = true)
    public void updateCertificate(User user, UUID certificateId, CertificateRequest request) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(CertificateExceptions.CERTIFICATE_NOT_FOUND::toException);

        if (!certificate.getUser().getId().equals(user.getId())) {
            throw CertificateExceptions.FORBIDDEN_CERTIFICATE.toException();
        }

        verifyFileKeyOwnership(user, request.fileKey());

        String previousFileKey = certificate.update(request);
        if (previousFileKey != null && !Objects.equals(previousFileKey, request.fileKey())) {
            s3FileClient.delete(previousFileKey);
        }
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.USER_STATS_CACHE, allEntries = true)
    public void deleteCertificate(User user, UUID certificateId) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(CertificateExceptions.CERTIFICATE_NOT_FOUND::toException);

        if (!certificate.getUser().getId().equals(user.getId())) {
            throw CertificateExceptions.FORBIDDEN_CERTIFICATE.toException();
        }

        String fileKey = certificate.getFileKey();
        certificateRepository.delete(certificate);

        if (fileKey != null) {
            s3FileClient.delete(fileKey);
        }
    }

    private void verifyFileKeyOwnership(User user, String fileKey) {
        if (fileKey == null) {
            return;
        }
        String expectedPrefix = CERTIFICATE_KEY_PREFIX + user.getId() + "/";
        if (!fileKey.startsWith(expectedPrefix) || !fileKey.endsWith(".pdf")) {
            throw CertificateExceptions.INVALID_FILE_KEY.toException();
        }
    }
}
