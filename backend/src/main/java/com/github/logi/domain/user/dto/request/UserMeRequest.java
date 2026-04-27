package com.github.logi.domain.user.dto.request;

import com.github.logi.domain.user.entity.JobFirst;
import com.github.logi.domain.user.entity.JobSecond;
import com.github.logi.domain.user.entity.JobThird;
import com.github.logi.domain.user.entity.KookminDepartment;
import com.github.logi.domain.user.entity.State;

public record UserMeRequest(
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
}
