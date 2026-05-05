package com.github.logi.domain.experience.entity;

import com.github.logi.domain.experience.dto.request.ExperienceRequest;
import com.github.logi.domain.user.entity.User;
import com.github.logi.global.entity.BaseEntity;
import com.github.logi.global.type.VectorType;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.Type;

@Getter
@Entity
@Table(name = "experiences")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE experiences SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Experience extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "experience_category", length = 20)
    private ExperienceCategory experienceCategory;

    @Column(name = "related_major", length = 100)
    private String relatedMajor;

    @Column(name = "experience_title", length = 200)
    private String experienceTitle;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "star_s", columnDefinition = "TEXT")
    private String starS;

    @Column(name = "star_t", columnDefinition = "TEXT")
    private String starT;

    @Column(name = "star_a", columnDefinition = "TEXT")
    private String starA;

    @Column(name = "star_r", columnDefinition = "TEXT")
    private String starR;

    @Type(VectorType.class)
    @Column(name = "experience_embeddings", columnDefinition = "vector(1024)")
    private float[] embedding;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public static Experience create(User user, ExperienceRequest request) {
        Experience experience = new Experience();
        experience.user = user;
        experience.experienceCategory = request.experienceCategory();
        experience.relatedMajor = request.relatedMajor();
        experience.experienceTitle = request.experienceTitle();
        experience.startDate = request.startDate();
        experience.endDate = request.endDate();
        experience.starS = request.starStructure().s();
        experience.starT = request.starStructure().t();
        experience.starA = request.starStructure().a();
        experience.starR = request.starStructure().r();
        return experience;
    }

    public void updateEmbedding(float[] embedding) {
        this.embedding = embedding;
    }

    public void update(ExperienceRequest request) {
        this.experienceCategory = request.experienceCategory();
        this.relatedMajor = request.relatedMajor();
        this.experienceTitle = request.experienceTitle();
        this.startDate = request.startDate();
        this.endDate = request.endDate();
        this.starS = request.starStructure().s();
        this.starT = request.starStructure().t();
        this.starA = request.starStructure().a();
        this.starR = request.starStructure().r();
    }
}
