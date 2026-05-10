package com.github.logi.domain.certificate.repository;

import com.github.logi.domain.certificate.entity.Certificate;
import com.github.logi.domain.user.entity.KookminDepartment;
import com.github.logi.domain.user.entity.State;
import com.github.logi.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CertificateRepository extends JpaRepository<Certificate, UUID> {
    List<Certificate> findAllByUser(User user);

    void deleteAllByUser(User user);

    // major + state 기준 평균 자격증 수
    @Query("""
            SELECT COUNT(c) * 1.0 / COUNT(DISTINCT c.user) AS avg
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.state = :state
            """)
    Double findLicenseAvgByMajorAndState(
            @Param("major") KookminDepartment major,
            @Param("state") State state
    );

    @Query("""
            SELECT COUNT(c) * 1.0 / COUNT(DISTINCT c.user) AS avg
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.schoolNumber LIKE :schoolNumPrefix%
            """)
    Double findLicenseAvgByMajorAndSchoolNum(
            @Param("major") KookminDepartment major,
            @Param("schoolNumPrefix") String schoolNumPrefix
    );

    @Query("""
            SELECT COUNT(c) * 1.0 / COUNT(DISTINCT c.user) AS avg
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.state = com.github.logi.domain.user.entity.State.WORKER
            """)
    Double findLicenseAvgByMajorAndWorker(
            @Param("major") KookminDepartment major
    );

    // major + state 기준 자격증 보유 유저 수
    @Query("""
            SELECT COUNT(DISTINCT c.user) AS userCount
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.state = :state
            """)
    Long findLicenseUserCountByMajorAndState(
            @Param("major") KookminDepartment major,
            @Param("state") State state
    );

    @Query("""
            SELECT COUNT(DISTINCT c.user) AS userCount
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.schoolNumber LIKE :schoolNumPrefix%
            """)
    Long findLicenseUserCountByMajorAndSchoolNum(
            @Param("major") KookminDepartment major,
            @Param("schoolNumPrefix") String schoolNumPrefix
    );

    @Query("""
            SELECT COUNT(DISTINCT c.user) AS userCount
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.state = com.github.logi.domain.user.entity.State.WORKER
            """)
    Long findLicenseUserCountByMajorAndWorker(
            @Param("major") KookminDepartment major
    );

    // weakPoints 추천용: major + state 기준 자격증명 Top N
    @Query("""
            SELECT c.certificateName AS name, COUNT(c) AS cnt
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.state = :state
            GROUP BY c.certificateName
            ORDER BY cnt DESC
            """)
    List<CertNameCountView> findTopCertNamesByMajorAndState(
            @Param("major") KookminDepartment major,
            @Param("state") State state
    );

    @Query("""
            SELECT c.certificateName AS name, COUNT(c) AS cnt
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.schoolNumber LIKE :schoolNumPrefix%
            GROUP BY c.certificateName
            ORDER BY cnt DESC
            """)
    List<CertNameCountView> findTopCertNamesByMajorAndSchoolNum(
            @Param("major") KookminDepartment major,
            @Param("schoolNumPrefix") String schoolNumPrefix
    );

    @Query("""
            SELECT c.certificateName AS name, COUNT(c) AS cnt
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.state = com.github.logi.domain.user.entity.State.WORKER
            GROUP BY c.certificateName
            ORDER BY cnt DESC
            """)
    List<CertNameCountView> findTopCertNamesByMajorAndWorker(
            @Param("major") KookminDepartment major
    );

    // 현재 유저의 자격증 수
    @Query("SELECT COUNT(c) FROM Certificate c WHERE c.user = :user")
    Long countByUser(@Param("user") User user);

    interface CertNameCountView {
        String getName();
        Long getCnt();
    }
}
