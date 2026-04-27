package com.github.logi.domain.user.service;

import com.github.logi.domain.user.dto.request.UserMeRequest;
import com.github.logi.domain.user.dto.response.UserMeResponse;
import com.github.logi.domain.user.entity.User;
import com.github.logi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserMeResponse getMe(User user) {
        return UserMeResponse.from(user);
    }

    @Transactional
    public UserMeResponse updateMe(User user, UserMeRequest request) {
        user.update(request);
        userRepository.save(user);
        return UserMeResponse.from(user);
    }
}
