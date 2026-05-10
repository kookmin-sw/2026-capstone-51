package com.github.logi.domain.experience.repository;

import com.github.logi.domain.experience.entity.Experience;
import com.github.logi.domain.experience.entity.ExperienceCategory;
import com.github.logi.domain.user.entity.KookminDepartment;
import com.github.logi.domain.user.entity.State;
import com.github.logi.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ExperienceRepository extends JpaRepository<Experience, UUID> {
    List<Experience> findAllByUser(User user);

    // major + state 기준 카테고리별 평균 경험 수 (STATE groupBy)
    @Query("""
            SELECT e.experienceCategory AS category, COUNT(e) * 1.0 / COUNT(DISTINCT e.user) AS avg
            FROM Experience e
            JOIN e.user u
            WHERE u.major = :major AND u.state = :state
            GROUP BY e.experienceCategory
            """)
    List<CategoryAvgView> findCategoryAvgByMajorAndState(
            @Param("major") KookminDepartment major,
            @Param("state") State state
    );

    // major + schoolNumber prefix 기준 카테고리별 평균 (SCHOOL_NUM groupBy)
    @Query("""
            SELECT e.experienceCategory AS category, COUNT(e) * 1.0 / COUNT(DISTINCT e.user) AS avg
            FROM Experience e
            JOIN e.user u
            WHERE u.major = :major AND u.schoolNumber LIKE :schoolNumPrefix%
            GROUP BY e.experienceCategory
            """)
    List<CategoryAvgView> findCategoryAvgByMajorAndSchoolNum(
            @Param("major") KookminDepartment major,
            @Param("schoolNumPrefix") String schoolNumPrefix
    );

    // major + WORKER 기준 카테고리별 평균 (WORKER groupBy)
    @Query("""
            SELECT e.experienceCategory AS category, COUNT(e) * 1.0 / COUNT(DISTINCT e.user) AS avg
            FROM Experience e
            JOIN e.user u
            WHERE u.major = :major AND u.state = com.github.logi.domain.user.entity.State.WORKER
            GROUP BY e.experienceCategory
            """)
    List<CategoryAvgView> findCategoryAvgByMajorAndWorker(
            @Param("major") KookminDepartment major
    );

    // major + state 기준 경험 카테고리별 유저 수 (해당 카테고리를 가진 유저 수)
    @Query("""
            SELECT e.experienceCategory AS category, COUNT(DISTINCT e.user) AS userCount
            FROM Experience e
            JOIN e.user u
            WHERE u.major = :major AND u.state = :state
            GROUP BY e.experienceCategory
            """)
    List<CategoryUserCountView> findCategoryUserCountByMajorAndState(
            @Param("major") KookminDepartment major,
            @Param("state") State state
    );

    @Query("""
            SELECT e.experienceCategory AS category, COUNT(DISTINCT e.user) AS userCount
            FROM Experience e
            JOIN e.user u
            WHERE u.major = :major AND u.schoolNumber LIKE :schoolNumPrefix%
            GROUP BY e.experienceCategory
            """)
    List<CategoryUserCountView> findCategoryUserCountByMajorAndSchoolNum(
            @Param("major") KookminDepartment major,
            @Param("schoolNumPrefix") String schoolNumPrefix
    );

    @Query("""
            SELECT e.experienceCategory AS category, COUNT(DISTINCT e.user) AS userCount
            FROM Experience e
            JOIN e.user u
            WHERE u.major = :major AND u.state = com.github.logi.domain.user.entity.State.WORKER
            GROUP BY e.experienceCategory
            """)
    List<CategoryUserCountView> findCategoryUserCountByMajorAndWorker(
            @Param("major") KookminDepartment major
    );

    // major + state 기준 자신을 제외한 최신 경험 제목 Top N (weakPoints 추천)
    @Query("""
            SELECT e.experienceTitle AS title, e.createdAt AS createdAt
            FROM Experience e
            JOIN e.user u
            WHERE u.major = :major AND u.state = :state AND e.experienceCategory = :category
              AND e.user <> :me
            ORDER BY e.createdAt DESC
            """)
    List<TitleCountView> findTopTitlesByMajorAndStateAndCategory(
            @Param("major") KookminDepartment major,
            @Param("state") State state,
            @Param("category") ExperienceCategory category,
            @Param("me") User me
    );

    @Query("""
            SELECT e.experienceTitle AS title, e.createdAt AS createdAt
            FROM Experience e
            JOIN e.user u
            WHERE u.major = :major AND u.schoolNumber LIKE :schoolNumPrefix%
              AND e.experienceCategory = :category
              AND e.user <> :me
            ORDER BY e.createdAt DESC
            """)
    List<TitleCountView> findTopTitlesByMajorAndSchoolNumAndCategory(
            @Param("major") KookminDepartment major,
            @Param("schoolNumPrefix") String schoolNumPrefix,
            @Param("category") ExperienceCategory category,
            @Param("me") User me
    );

    @Query("""
            SELECT e.experienceTitle AS title, e.createdAt AS createdAt
            FROM Experience e
            JOIN e.user u
            WHERE u.major = :major AND u.state = com.github.logi.domain.user.entity.State.WORKER
              AND e.experienceCategory = :category
              AND e.user <> :me
            ORDER BY e.createdAt DESC
            """)
    List<TitleCountView> findTopTitlesByMajorAndWorkerAndCategory(
            @Param("major") KookminDepartment major,
            @Param("category") ExperienceCategory category,
            @Param("me") User me
    );

    // 현재 유저의 카테고리별 경험 수
    @Query("""
            SELECT e.experienceCategory AS category, COUNT(e) AS cnt
            FROM Experience e
            WHERE e.user = :user
            GROUP BY e.experienceCategory
            """)
    List<CategoryCountView> findUserCategoryCount(@Param("user") User user);

    interface CategoryAvgView {
        ExperienceCategory getCategory();
        Double getAvg();
    }

    interface CategoryUserCountView {
        ExperienceCategory getCategory();
        Long getUserCount();
    }

    interface TitleCountView {
        String getTitle();
    }

    interface CategoryCountView {
        ExperienceCategory getCategory();
        Long getCnt();
    }

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
