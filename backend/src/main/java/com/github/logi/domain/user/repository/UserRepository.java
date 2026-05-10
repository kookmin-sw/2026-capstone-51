package com.github.logi.domain.user.repository;

import com.github.logi.domain.user.entity.JobFirst;
import com.github.logi.domain.user.entity.JobSecond;
import com.github.logi.domain.user.entity.JobThird;
import com.github.logi.domain.user.entity.KookminDepartment;
import com.github.logi.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    @Query("""
            SELECT u FROM User u
            WHERE u.major = :major
              AND u.state = com.github.logi.domain.user.entity.State.WORKER
              AND u.jobThird = :jobThird
              AND u <> :me
            ORDER BY u.createdAt DESC
            """)
    List<User> findWorkersByMajorAndJobThird(
            @Param("major") KookminDepartment major,
            @Param("jobThird") JobThird jobThird,
            @Param("me") User me
    );

    @Query("""
            SELECT u FROM User u
            WHERE u.major = :major
              AND u.state = com.github.logi.domain.user.entity.State.WORKER
              AND u.jobSecond = :jobSecond
              AND u <> :me
            ORDER BY u.createdAt DESC
            """)
    List<User> findWorkersByMajorAndJobSecond(
            @Param("major") KookminDepartment major,
            @Param("jobSecond") JobSecond jobSecond,
            @Param("me") User me
    );

    @Query("""
            SELECT u FROM User u
            WHERE u.major = :major
              AND u.state = com.github.logi.domain.user.entity.State.WORKER
              AND u.jobFirst = :jobFirst
              AND u <> :me
            ORDER BY u.createdAt DESC
            """)
    List<User> findWorkersByMajorAndJobFirst(
            @Param("major") KookminDepartment major,
            @Param("jobFirst") JobFirst jobFirst,
            @Param("me") User me
    );
}
