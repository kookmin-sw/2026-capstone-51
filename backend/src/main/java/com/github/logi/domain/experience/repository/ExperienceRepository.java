package com.github.logi.domain.experience.repository;

import com.github.logi.domain.experience.entity.Experience;
import com.github.logi.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExperienceRepository extends JpaRepository<Experience, UUID> {
    List<Experience> findAllByUser(User user);
}
