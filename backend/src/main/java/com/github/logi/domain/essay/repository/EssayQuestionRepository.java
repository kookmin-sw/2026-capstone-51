package com.github.logi.domain.essay.repository;

import com.github.logi.domain.essay.entity.EssayQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface EssayQuestionRepository extends JpaRepository<EssayQuestion, UUID> {

    @Query("SELECT q FROM EssayQuestion q JOIN FETCH q.essay WHERE q.id = :questionId")
    Optional<EssayQuestion> findByIdWithEssay(@Param("questionId") UUID questionId);
}
