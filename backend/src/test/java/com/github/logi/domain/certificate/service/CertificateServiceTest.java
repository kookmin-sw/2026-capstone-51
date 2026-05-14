package com.github.logi.domain.certificate.service;

import com.github.logi.domain.certificate.dto.request.CertificateRequest;
import com.github.logi.domain.certificate.dto.response.CertificateUploadUrlResponse;
import com.github.logi.domain.certificate.entity.Certificate;
import com.github.logi.domain.certificate.exception.CertificateExceptions;
import com.github.logi.domain.certificate.repository.CertificateRepository;
import com.github.logi.domain.user.entity.User;
import com.github.logi.global.exception.ApiException;
import com.github.logi.global.storage.S3FileClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CertificateServiceTest {

    @Mock
    private CertificateRepository certificateRepository;

    @Mock
    private S3FileClient s3FileClient;

    @InjectMocks
    private CertificateService certificateService;

    private User owner;
    private UUID ownerId;
    private UUID otherUserId;

    @BeforeEach
    void setUp() throws Exception {
        owner = User.create("owner@test.com", "주인");
        ownerId = UUID.randomUUID();
        otherUserId = UUID.randomUUID();
        setBaseEntityId(owner, ownerId);
    }

    @Test
    @DisplayName("issueUploadUrl: 사용자별 prefix로 파일 키를 생성하고 presigned URL을 반환한다")
    void issueUploadUrl_returnsKeyAndUrl() {
        when(s3FileClient.generateUploadUrl(anyString(), anyString())).thenReturn("https://signed.url");

        CertificateUploadUrlResponse response = certificateService.issueUploadUrl(owner);

        assertThat(response.fileKey()).startsWith("certificates/" + ownerId + "/");
        assertThat(response.fileKey()).endsWith(".pdf");
        assertThat(response.contentType()).isEqualTo("application/pdf");
        assertThat(response.uploadUrl()).isEqualTo("https://signed.url");
    }

    @Test
    @DisplayName("createCertificate: 본인 prefix 파일 키이면 저장한다")
    void createCertificate_savesWhenOwnFileKey() {
        String validKey = "certificates/" + ownerId + "/" + UUID.randomUUID() + ".pdf";
        CertificateRequest request = sampleRequest(validKey);

        certificateService.createCertificate(owner, request);

        verify(certificateRepository, times(1)).save(any(Certificate.class));
    }

    @Test
    @DisplayName("createCertificate: 다른 사용자 prefix면 INVALID_FILE_KEY 예외")
    void createCertificate_rejectsForeignFileKey() {
        String foreignKey = "certificates/" + otherUserId + "/" + UUID.randomUUID() + ".pdf";
        CertificateRequest request = sampleRequest(foreignKey);

        assertThatThrownBy(() -> certificateService.createCertificate(owner, request))
                .isInstanceOf(ApiException.class)
                .hasMessage(CertificateExceptions.INVALID_FILE_KEY.getMessage());
        verify(certificateRepository, never()).save(any());
    }

    @Test
    @DisplayName("createCertificate: 확장자가 pdf가 아니면 INVALID_FILE_KEY 예외")
    void createCertificate_rejectsNonPdf() {
        String badKey = "certificates/" + ownerId + "/" + UUID.randomUUID() + ".jpg";
        CertificateRequest request = sampleRequest(badKey);

        assertThatThrownBy(() -> certificateService.createCertificate(owner, request))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("updateCertificate: 존재하지 않으면 CERTIFICATE_NOT_FOUND 예외")
    void updateCertificate_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(certificateRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> certificateService.updateCertificate(owner, id, sampleRequest(null)))
                .isInstanceOf(ApiException.class)
                .hasMessage(CertificateExceptions.CERTIFICATE_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("updateCertificate: 다른 사용자의 자격증이면 FORBIDDEN_CERTIFICATE 예외")
    void updateCertificate_throwsWhenNotOwner() throws Exception {
        User other = User.create("other@test.com", "남");
        setBaseEntityId(other, otherUserId);
        Certificate cert = Certificate.create(other, sampleRequest(null));
        UUID certId = UUID.randomUUID();
        when(certificateRepository.findById(certId)).thenReturn(Optional.of(cert));

        assertThatThrownBy(() -> certificateService.updateCertificate(owner, certId, sampleRequest(null)))
                .isInstanceOf(ApiException.class)
                .hasMessage(CertificateExceptions.FORBIDDEN_CERTIFICATE.getMessage());
    }

    @Test
    @DisplayName("updateCertificate: 파일 키가 바뀌면 기존 S3 객체를 삭제한다")
    void updateCertificate_deletesPreviousFile() {
        String oldKey = "certificates/" + ownerId + "/old.pdf";
        String newKey = "certificates/" + ownerId + "/new.pdf";
        Certificate cert = Certificate.create(owner, sampleRequest(oldKey));
        UUID certId = UUID.randomUUID();
        when(certificateRepository.findById(certId)).thenReturn(Optional.of(cert));

        certificateService.updateCertificate(owner, certId, sampleRequest(newKey));

        verify(s3FileClient, times(1)).delete(oldKey);
    }

    @Test
    @DisplayName("deleteCertificate: 본인 자격증이면 삭제 후 S3 객체도 제거한다")
    void deleteCertificate_removesEntityAndFile() {
        String fileKey = "certificates/" + ownerId + "/file.pdf";
        Certificate cert = Certificate.create(owner, sampleRequest(fileKey));
        UUID certId = UUID.randomUUID();
        when(certificateRepository.findById(certId)).thenReturn(Optional.of(cert));

        certificateService.deleteCertificate(owner, certId);

        verify(certificateRepository, times(1)).delete(cert);
        verify(s3FileClient, times(1)).delete(fileKey);
    }

    @Test
    @DisplayName("deleteCertificate: 다른 사용자 자격증은 FORBIDDEN_CERTIFICATE 예외")
    void deleteCertificate_throwsWhenNotOwner() throws Exception {
        User other = User.create("other@test.com", "남");
        setBaseEntityId(other, otherUserId);
        Certificate cert = Certificate.create(other, sampleRequest(null));
        UUID certId = UUID.randomUUID();
        when(certificateRepository.findById(certId)).thenReturn(Optional.of(cert));

        assertThatThrownBy(() -> certificateService.deleteCertificate(owner, certId))
                .isInstanceOf(ApiException.class)
                .hasMessage(CertificateExceptions.FORBIDDEN_CERTIFICATE.getMessage());
        verify(certificateRepository, never()).delete(any());
    }

    private CertificateRequest sampleRequest(String fileKey) {
        return new CertificateRequest(
                "정보처리기사",
                "2024-01-01",
                "2030-01-01",
                "ABC123",
                "한국산업인력공단",
                fileKey
        );
    }

    private void setBaseEntityId(Object entity, UUID id) throws Exception {
        Field field = entity.getClass().getSuperclass().getDeclaredField("id");
        field.setAccessible(true);
        field.set(entity, id);
    }
}
