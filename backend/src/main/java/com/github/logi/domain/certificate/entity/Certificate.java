package com.github.logi.domain.certificate.entity;

import com.github.logi.domain.certificate.dto.request.CertificateRequest;
import com.github.logi.domain.user.entity.User;
import com.github.logi.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "certificates")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Certificate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "certificate_name", length = 50)
    private String certificateName;

    @Column(name = "get_date", length = 20)
    private String getDate;

    @Column(name = "expiration_date", length = 20)
    private String expirationDate;

    @Column(name = "certificate_code", length = 50)
    private String certificateCode;

    @Column(name = "issuing_organization", length = 50)
    private String issuingOrganization;

    public static Certificate create(User user, CertificateRequest request) {
        Certificate certificate = new Certificate();
        certificate.user = user;
        certificate.certificateName = request.certificateName();
        certificate.getDate = request.getDate();
        certificate.expirationDate = request.expirationDate();
        certificate.certificateCode = request.certificateCode();
        certificate.issuingOrganization = request.issuingOrganization();
        return certificate;
    }

    public void update(CertificateRequest request) {
        this.certificateName = request.certificateName();
        this.getDate = request.getDate();
        this.expirationDate = request.expirationDate();
        this.certificateCode = request.certificateCode();
        this.issuingOrganization = request.issuingOrganization();
    }

}
