package com.github.logi.domain.certificate.repository;

import com.github.logi.domain.certificate.entity.Certificate;
import com.github.logi.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CertificateRepository extends JpaRepository<Certificate, UUID> {
    List<Certificate> findAllByUser(User user);
}
