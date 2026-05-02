package com.github.logi.domain.user.entity;

import com.github.logi.domain.user.dto.request.UserMeRequest;
import com.github.logi.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity {

    @Column(name = "email", length = 100, nullable = false, unique = true)
    private String email;

    @Column(name = "user_name", length = 50)
    private String userName;

    @Enumerated(EnumType.STRING)
    @Column(name = "state")
    private State state;

    @Column(name = "score")
    private Float score;

    @Enumerated(EnumType.STRING)
    @Column(name = "major")
    private KookminDepartment major;

    @Enumerated(EnumType.STRING)
    @Column(name = "minor")
    private KookminDepartment minor;

    @Column(name = "school_number", length = 20)
    private String schoolNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_first")
    private JobFirst jobFirst;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_second")
    private JobSecond jobSecond;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_third")
    private JobThird jobThird;

    public static User create(String email, String userName) {
        User user = new User();
        user.email = email;
        user.userName = userName;
        return user;
    }

    public void update(UserMeRequest request) {
        this.userName = request.userName();
        this.state = request.state();
        this.score = request.score();
        this.major = request.major();
        this.minor = request.minor();
        this.schoolNumber = request.schoolNumber();
        this.jobFirst = request.jobFirst();
        this.jobSecond = request.jobSecond();
        this.jobThird = request.jobThird();
    }
}
