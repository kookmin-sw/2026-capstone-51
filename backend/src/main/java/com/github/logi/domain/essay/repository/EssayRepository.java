package com.github.logi.domain.essay.repository;

import com.github.logi.domain.essay.entity.Essay;
import com.github.logi.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EssayRepository extends JpaRepository<Essay, UUID> {
    List<Essay> findAllByUser(User user);

    @Query("SELECT DISTINCT e FROM Essay e LEFT JOIN FETCH e.questions WHERE e.id = :id")
    Optional<Essay> findByIdWithQuestions(@Param("id") UUID id);
}
