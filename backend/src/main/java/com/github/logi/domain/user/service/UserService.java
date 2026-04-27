package com.github.logi.domain.user.service;

import com.github.logi.domain.user.dto.response.UserMeResponse;
import com.github.logi.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    public UserMeResponse getMe(User user) {
        return UserMeResponse.from(user);
    }
}
