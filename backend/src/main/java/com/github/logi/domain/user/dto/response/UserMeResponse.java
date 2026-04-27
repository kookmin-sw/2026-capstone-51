package com.github.logi.domain.user.dto.response;

import com.github.logi.domain.user.entity.JobFirst;
import com.github.logi.domain.user.entity.JobSecond;
import com.github.logi.domain.user.entity.JobThird;
import com.github.logi.domain.user.entity.KookminDepartment;
import com.github.logi.domain.user.entity.State;
import com.github.logi.domain.user.entity.User;

public record UserMeResponse(
        String userName,
        State state,
        Float score,
        KookminDepartment major,
        KookminDepartment minor,
        String schoolNumber,
        JobFirst jobFirst,
        JobSecond jobSecond,
        JobThird jobThird
) {
    public static UserMeResponse from(User user) {
        return new UserMeResponse(
                user.getUserName(),
                user.getState(),
                user.getScore(),
                user.getMajor(),
                user.getMinor(),
                user.getSchoolNumber(),
                user.getJobFirst(),
                user.getJobSecond(),
                user.getJobThird()
        );
    }
}
