package com.github.logi.domain.user.service;

import com.github.logi.domain.user.dto.request.UserMeRequest;
import com.github.logi.domain.user.dto.response.UserMeResponse;
import com.github.logi.domain.user.entity.JobFirst;
import com.github.logi.domain.user.entity.JobSecond;
import com.github.logi.domain.user.entity.JobThird;
import com.github.logi.domain.user.entity.KookminDepartment;
import com.github.logi.domain.user.entity.State;
import com.github.logi.domain.user.entity.User;
import com.github.logi.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.create("test@kookmin.ac.kr", "홍길동");
    }

    @Test
    @DisplayName("getMe: User 엔티티를 UserMeResponse로 변환하여 반환한다")
    void getMe_returnsUserMeResponse() {
        UserMeResponse response = userService.getMe(user);

        assertThat(response).isNotNull();
        assertThat(response.userName()).isEqualTo("홍길동");
    }

    @Test
    @DisplayName("updateMe: 요청 정보로 사용자 필드를 갱신하고 저장한다")
    void updateMe_updatesUserAndSaves() {
        UserMeRequest request = new UserMeRequest(
                "김국민",
                State.SENIOR,
                4.3f,
                KookminDepartment.GLOBAL_KOREAN_LANGUAGE,
                KookminDepartment.GLOBAL_ENGLISH,
                "20191234",
                JobFirst.경영_사무_금융_보험,
                null,
                null
        );
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserMeResponse response = userService.updateMe(user, request);

        assertThat(response.userName()).isEqualTo("김국민");
        assertThat(response.state()).isEqualTo(State.SENIOR);
        assertThat(response.score()).isEqualTo(4.3f);
        assertThat(response.major()).isEqualTo(KookminDepartment.GLOBAL_KOREAN_LANGUAGE);
        assertThat(response.minor()).isEqualTo(KookminDepartment.GLOBAL_ENGLISH);
        assertThat(response.schoolNumber()).isEqualTo("20191234");
        assertThat(response.jobFirst()).isEqualTo(JobFirst.경영_사무_금융_보험);
        verify(userRepository, times(1)).save(user);
    }

    @Test
    @DisplayName("User.create: 이메일과 이름으로 User를 생성한다")
    void userCreate_setsEmailAndName() {
        User created = User.create("a@b.com", "이몽룡");

        assertThat(created.getEmail()).isEqualTo("a@b.com");
        assertThat(created.getUserName()).isEqualTo("이몽룡");
    }
}
