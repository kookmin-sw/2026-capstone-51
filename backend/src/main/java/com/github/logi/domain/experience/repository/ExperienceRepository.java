package com.github.logi.domain.experience.repository;

import com.github.logi.domain.experience.entity.Experience;
import com.github.logi.domain.experience.entity.ExperienceCategory;
import com.github.logi.domain.user.entity.KookminDepartment;
import com.github.logi.domain.user.entity.State;
import com.github.logi.domain.user.entity.User;
import org.springframework.data.domain.Pageable;
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
            SELECT e.experienceCategory AS category, CASE WHEN COUNT(DISTINCT e.user) = 0 THEN 0.0 ELSE COUNT(e) * 1.0 / COUNT(DISTINCT e.user) END AS avg
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
            SELECT e.experienceCategory AS category, CASE WHEN COUNT(DISTINCT e.user) = 0 THEN 0.0 ELSE COUNT(e) * 1.0 / COUNT(DISTINCT e.user) END AS avg
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
            SELECT e.experienceCategory AS category, CASE WHEN COUNT(DISTINCT e.user) = 0 THEN 0.0 ELSE COUNT(e) * 1.0 / COUNT(DISTINCT e.user) END AS avg
            FROM Experience e
            JOIN e.user u
            WHERE u.major = :major AND u.state = com.github.logi.domain.user.entity.State.WORKER
            GROUP BY e.experienceCategory
            """)
    List<CategoryAvgView> findCategoryAvgByMajorAndWorker(
            @Param("major") KookminDepartment major
    );

    // major + state 기준 카테고리별 유저 최대 경험 수
    @Query(value = """
            SELECT sub.experience_category AS category, MAX(sub.cnt) AS maxCount
            FROM (
                SELECT e.experience_category, e.user_id, COUNT(e.id) AS cnt
                FROM experiences e
                JOIN users u ON u.id = e.user_id
                WHERE u.major = :major AND u.state = :state AND e.deleted_at IS NULL
                GROUP BY e.experience_category, e.user_id
            ) sub
            GROUP BY sub.experience_category
            """, nativeQuery = true)
    List<CategoryMaxCountView> findCategoryMaxCountByMajorAndState(
            @Param("major") String major,
            @Param("state") String state
    );

    @Query(value = """
            SELECT sub.experience_category AS category, MAX(sub.cnt) AS maxCount
            FROM (
                SELECT e.experience_category, e.user_id, COUNT(e.id) AS cnt
                FROM experiences e
                JOIN users u ON u.id = e.user_id
                WHERE u.major = :major AND u.school_number LIKE :schoolNumPrefix% AND e.deleted_at IS NULL
                GROUP BY e.experience_category, e.user_id
            ) sub
            GROUP BY sub.experience_category
            """, nativeQuery = true)
    List<CategoryMaxCountView> findCategoryMaxCountByMajorAndSchoolNum(
            @Param("major") String major,
            @Param("schoolNumPrefix") String schoolNumPrefix
    );

    @Query(value = """
            SELECT sub.experience_category AS category, MAX(sub.cnt) AS maxCount
            FROM (
                SELECT e.experience_category, e.user_id, COUNT(e.id) AS cnt
                FROM experiences e
                JOIN users u ON u.id = e.user_id
                WHERE u.major = :major AND u.state = 'WORKER' AND e.deleted_at IS NULL
                GROUP BY e.experience_category, e.user_id
            ) sub
            GROUP BY sub.experience_category
            """, nativeQuery = true)
    List<CategoryMaxCountView> findCategoryMaxCountByMajorAndWorker(
            @Param("major") String major
    );

    // relatedMajor 기준 자신을 제외한 최신 경험 제목 Top N (weakPoints 추천)
    @Query("""
            SELECT e.experienceTitle AS title
            FROM Experience e
            JOIN e.user u
            WHERE e.stateAtCreation = :state AND e.experienceCategory = :category
              AND e.user <> :me AND e.relatedMajor = :relatedMajor
            ORDER BY e.createdAt DESC
            """)
    List<TitleCountView> findTopTitlesByMajorAndStateAndCategory(
            @Param("state") State state,
            @Param("category") ExperienceCategory category,
            @Param("me") User me,
            @Param("relatedMajor") KookminDepartment relatedMajor,
            Pageable pageable
    );

    @Query("""
            SELECT e.experienceTitle AS title
            FROM Experience e
            JOIN e.user u
            WHERE u.schoolNumber LIKE :schoolNumPrefix%
              AND e.experienceCategory = :category
              AND e.user <> :me AND e.relatedMajor = :relatedMajor
            ORDER BY e.createdAt DESC
            """)
    List<TitleCountView> findTopTitlesByMajorAndSchoolNumAndCategory(
            @Param("schoolNumPrefix") String schoolNumPrefix,
            @Param("category") ExperienceCategory category,
            @Param("me") User me,
            @Param("relatedMajor") KookminDepartment relatedMajor,
            Pageable pageable
    );

    @Query("""
            SELECT e.experienceTitle AS title
            FROM Experience e
            JOIN e.user u
            WHERE u.state = com.github.logi.domain.user.entity.State.WORKER
              AND e.experienceCategory = :category
              AND e.user <> :me AND e.relatedMajor = :relatedMajor
            ORDER BY e.createdAt DESC
            """)
    List<TitleCountView> findTopTitlesByMajorAndWorkerAndCategory(
            @Param("category") ExperienceCategory category,
            @Param("me") User me,
            @Param("relatedMajor") KookminDepartment relatedMajor,
            Pageable pageable
    );

    // 현재 유저의 카테고리별 경험 수
    @Query("""
            SELECT e.experienceCategory AS category, COUNT(e) AS cnt
            FROM Experience e
            WHERE e.user = :user
            GROUP BY e.experienceCategory
            """)
    List<CategoryCountView> findUserCategoryCount(@Param("user") User user);

    // 여러 유저의 경험을 한 번에 조회 (N+1 방지)
    @Query("""
            SELECT e FROM Experience e
            WHERE e.user IN :users
            """)
    List<Experience> findAllByUserIn(@Param("users") List<User> users);

    interface CategoryAvgView {
        ExperienceCategory getCategory();
        Double getAvg();
    }

    interface CategoryMaxCountView {
        String getCategory();
        Long getMaxCount();
    }

    interface TitleCountView {
        String getTitle();
    }

    interface CategoryCountView {
        ExperienceCategory getCategory();
        Long getCnt();
    }

    // 랭킹용: major + state 기준 유저별 카테고리 경험 수
    @Query("""
            SELECT e.user.id AS userId, e.user.userName AS userName, e.experienceCategory AS category, COUNT(e) AS cnt
            FROM Experience e
            JOIN e.user u
            WHERE u.major = :major AND u.state = :state
            GROUP BY e.user.id, e.user.userName, e.experienceCategory
            """)
    List<UserCategoryCountView> findExpCountPerUserByMajorAndState(
            @Param("major") KookminDepartment major,
            @Param("state") State state
    );

    @Query("""
            SELECT e.user.id AS userId, e.user.userName AS userName, e.experienceCategory AS category, COUNT(e) AS cnt
            FROM Experience e
            JOIN e.user u
            WHERE u.major = :major AND u.schoolNumber LIKE :schoolNumPrefix%
            GROUP BY e.user.id, e.user.userName, e.experienceCategory
            """)
    List<UserCategoryCountView> findExpCountPerUserByMajorAndSchoolNum(
            @Param("major") KookminDepartment major,
            @Param("schoolNumPrefix") String schoolNumPrefix
    );

    @Query("""
            SELECT e.user.id AS userId, e.user.userName AS userName, e.experienceCategory AS category, COUNT(e) AS cnt
            FROM Experience e
            JOIN e.user u
            WHERE u.major = :major AND u.state = com.github.logi.domain.user.entity.State.WORKER
            GROUP BY e.user.id, e.user.userName, e.experienceCategory
            """)
    List<UserCategoryCountView> findExpCountPerUserByMajorAndWorker(
            @Param("major") KookminDepartment major
    );

    interface UserCategoryCountView {
        java.util.UUID getUserId();
        String getUserName();
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
