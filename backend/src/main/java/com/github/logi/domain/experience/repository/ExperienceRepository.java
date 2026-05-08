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

    @Query(value = """
            SELECT id,
                   experience_title,
                   experience_embeddings <=> CAST(:embedding AS vector) AS distance
            FROM experiences
            WHERE user_id = :userId
              AND deleted_at IS NULL
              AND experience_embeddings IS NOT NULL
            ORDER BY distance
            LIMIT :limit
            """, nativeQuery = true)
    List<RecommendedExperienceView> findRecommendedByEmbedding(
            @Param("userId") UUID userId,
            @Param("embedding") String embedding,
            @Param("limit") int limit
    );

    interface RecommendedExperienceView {
        UUID getId();
        String getExperienceTitle();
        Double getDistance();
    }
}
