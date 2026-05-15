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
            SELECT CASE WHEN COUNT(DISTINCT c.user) = 0 THEN 0.0 ELSE COUNT(c) * 1.0 / COUNT(DISTINCT c.user) END AS avg
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.state = :state
            """)
    Double findLicenseAvgByMajorAndState(
            @Param("major") KookminDepartment major,
            @Param("state") State state
    );

    @Query("""
            SELECT CASE WHEN COUNT(DISTINCT c.user) = 0 THEN 0.0 ELSE COUNT(c) * 1.0 / COUNT(DISTINCT c.user) END AS avg
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.schoolNumber LIKE :schoolNumPrefix%
            """)
    Double findLicenseAvgByMajorAndSchoolNum(
            @Param("major") KookminDepartment major,
            @Param("schoolNumPrefix") String schoolNumPrefix
    );

    @Query("""
            SELECT CASE WHEN COUNT(DISTINCT c.user) = 0 THEN 0.0 ELSE COUNT(c) * 1.0 / COUNT(DISTINCT c.user) END AS avg
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.state = com.github.logi.domain.user.entity.State.WORKER
            """)
    Double findLicenseAvgByMajorAndWorker(
            @Param("major") KookminDepartment major
    );

    // major + state 기준 자격증 유저별 최대 수
    @Query("""
            SELECT MAX(sub.cnt) FROM (
                SELECT COUNT(c) AS cnt
                FROM Certificate c
                JOIN c.user u
                WHERE u.major = :major AND u.state = :state
                GROUP BY c.user
            ) sub
            """)
    Long findLicenseMaxCountByMajorAndState(
            @Param("major") KookminDepartment major,
            @Param("state") State state
    );

    @Query("""
            SELECT MAX(sub.cnt) FROM (
                SELECT COUNT(c) AS cnt
                FROM Certificate c
                JOIN c.user u
                WHERE u.major = :major AND u.schoolNumber LIKE :schoolNumPrefix%
                GROUP BY c.user
            ) sub
            """)
    Long findLicenseMaxCountByMajorAndSchoolNum(
            @Param("major") KookminDepartment major,
            @Param("schoolNumPrefix") String schoolNumPrefix
    );

    @Query("""
            SELECT MAX(sub.cnt) FROM (
                SELECT COUNT(c) AS cnt
                FROM Certificate c
                JOIN c.user u
                WHERE u.major = :major AND u.state = com.github.logi.domain.user.entity.State.WORKER
                GROUP BY c.user
            ) sub
            """)
    Long findLicenseMaxCountByMajorAndWorker(
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

    // 여러 유저의 자격증을 한 번에 조회 (N+1 방지)
    @Query("SELECT c FROM Certificate c WHERE c.user IN :users")
    List<Certificate> findAllByUserIn(@Param("users") List<User> users);

    interface CertNameCountView {
        String getName();
        Long getCnt();
    }

    // 랭킹용: major + state 기준 유저별 자격증 수
    @Query("""
            SELECT c.user.id AS userId, c.user.userName AS userName, COUNT(c) AS cnt
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.state = :state
            GROUP BY c.user.id, c.user.userName
            """)
    List<UserCertCountView> findCertCountPerUserByMajorAndState(
            @Param("major") KookminDepartment major,
            @Param("state") State state
    );

    @Query("""
            SELECT c.user.id AS userId, c.user.userName AS userName, COUNT(c) AS cnt
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.schoolNumber LIKE :schoolNumPrefix%
            GROUP BY c.user.id, c.user.userName
            """)
    List<UserCertCountView> findCertCountPerUserByMajorAndSchoolNum(
            @Param("major") KookminDepartment major,
            @Param("schoolNumPrefix") String schoolNumPrefix
    );

    @Query("""
            SELECT c.user.id AS userId, c.user.userName AS userName, COUNT(c) AS cnt
            FROM Certificate c
            JOIN c.user u
            WHERE u.major = :major AND u.state = com.github.logi.domain.user.entity.State.WORKER
            GROUP BY c.user.id, c.user.userName
            """)
    List<UserCertCountView> findCertCountPerUserByMajorAndWorker(
            @Param("major") KookminDepartment major
    );

    interface UserCertCountView {
        java.util.UUID getUserId();
        String getUserName();
        Long getCnt();
    }
}
