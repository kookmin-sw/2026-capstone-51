package com.github.logi.domain.essay.entity;

import com.github.logi.domain.experience.entity.Experience;
import com.github.logi.global.entity.BaseEntity;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "essay_questions")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EssayQuestion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "essay_id", nullable = false)
    private Essay essay;

    @Column(name = "question_num")
    private Integer questionNum;

    @Column(name = "question", columnDefinition = "TEXT", nullable = false)
    private String question;

    @Column(name = "response", columnDefinition = "TEXT", nullable = false)
    private String response;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "essay_question_experiences",
            joinColumns = @JoinColumn(name = "question_id"),
            inverseJoinColumns = @JoinColumn(name = "experience_id")
    )
    private List<Experience> experiences = new ArrayList<>();

    public static EssayQuestion create(Essay essay, Integer questionNum, String question, String response, List<Experience> experiences) {
        EssayQuestion eq = new EssayQuestion();
        eq.essay = essay;
        eq.questionNum = questionNum;
        eq.question = question;
        eq.response = response;
        eq.experiences = experiences;
        return eq;
    }

    public void update(String question, String response, List<Experience> experiences) {
        this.question = question;
        this.response = response;
        this.experiences = experiences;
    }
}
