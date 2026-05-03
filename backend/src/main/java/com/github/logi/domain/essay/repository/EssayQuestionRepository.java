package com.github.logi.domain.essay.repository;

import com.github.logi.domain.essay.entity.EssayQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EssayQuestionRepository extends JpaRepository<EssayQuestion, UUID> {
}
