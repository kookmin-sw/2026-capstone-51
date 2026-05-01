package com.github.logi.domain.experience.repository;

import com.github.logi.domain.experience.entity.Experience;
import com.github.logi.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ExperienceRepository extends JpaRepository<Experience, UUID> {
    List<Experience> findAllByUser(User user);

    @Modifying
    @Query(value = "DELETE FROM experiences WHERE user_id = :userId", nativeQuery = true)
    void hardDeleteAllByUserId(@Param("userId") UUID userId);
}
