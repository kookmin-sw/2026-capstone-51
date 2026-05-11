package com.github.logi.domain.essay.repository;

import com.github.logi.domain.essay.entity.EssayQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface EssayQuestionRepository extends JpaRepository<EssayQuestion, UUID> {

    @Query("SELECT q FROM EssayQuestion q JOIN FETCH q.essay WHERE q.id = :questionId")
    Optional<EssayQuestion> findByIdWithEssay(@Param("questionId") UUID questionId);

    @Query("""
            SELECT DISTINCT q FROM EssayQuestion q
            JOIN FETCH q.essay
            LEFT JOIN FETCH q.experiences
            WHERE q.id = :questionId
            """)
    Optional<EssayQuestion> findByIdWithEssayAndExperiences(@Param("questionId") UUID questionId);

    // essay 삭제 시 N+1 방지: ManyToMany 조인 테이블 먼저 일괄 삭제
    @Modifying
    @Query(value = "DELETE FROM essay_question_experiences WHERE question_id IN (SELECT id FROM essay_questions WHERE essay_id = :essayId)", nativeQuery = true)
    void deleteExperienceLinksByEssayId(@Param("essayId") UUID essayId);

    // essay 삭제 시 N+1 방지: 문항 일괄 삭제
    @Modifying
    @Query(value = "DELETE FROM essay_questions WHERE essay_id = :essayId", nativeQuery = true)
    void deleteAllByEssayIdNative(@Param("essayId") UUID essayId);
}
