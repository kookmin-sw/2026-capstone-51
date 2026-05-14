package com.github.logi.domain.experience.service;

import com.github.logi.domain.experience.dto.request.ExperienceRequest;
import com.github.logi.domain.experience.entity.Experience;
import com.github.logi.domain.experience.entity.ExperienceCategory;
import com.github.logi.domain.experience.exception.ExperienceExceptions;
import com.github.logi.domain.experience.repository.ExperienceRepository;
import com.github.logi.domain.user.entity.State;
import com.github.logi.domain.user.entity.User;
import com.github.logi.global.exception.ApiException;
import com.github.logi.global.sqs.SqsMessagePublisher;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExperienceServiceTest {

    @Mock
    private ExperienceRepository experienceRepository;

    @Mock
    private SqsMessagePublisher sqsMessagePublisher;

    @InjectMocks
    private ExperienceService experienceService;

    private User owner;
    private UUID ownerId;
    private UUID otherUserId;

    @BeforeEach
    void setUp() throws Exception {
        owner = User.create("owner@test.com", "주인");
        ownerId = UUID.randomUUID();
        otherUserId = UUID.randomUUID();
        setBaseEntityId(owner, ownerId);
        // Service uses TransactionSynchronizationManager — initialize for tests that touch it
        TransactionSynchronizationManager.initSynchronization();
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    @DisplayName("createExperience: 새 경험을 저장한다")
    void createExperience_savesExperience() {
        Experience saved = Experience.create(owner, sampleRequest());
        UUID savedId = UUID.randomUUID();
        setBaseEntityId(saved, savedId);
        when(experienceRepository.save(any(Experience.class))).thenReturn(saved);

        experienceService.createExperience(owner, sampleRequest());

        verify(experienceRepository, times(1)).save(any(Experience.class));
    }

    @Test
    @DisplayName("getExperience: 존재하지 않으면 EXPERIENCE_NOT_FOUND")
    void getExperience_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(experienceRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> experienceService.getExperience(owner, id))
                .isInstanceOf(ApiException.class)
                .hasMessage(ExperienceExceptions.EXPERIENCE_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("getExperience: 본인 경험이 아니면 FORBIDDEN_EXPERIENCE")
    void getExperience_throwsWhenNotOwner() throws Exception {
        User other = User.create("other@test.com", "남");
        setBaseEntityId(other, otherUserId);
        Experience exp = Experience.create(other, sampleRequest());
        UUID id = UUID.randomUUID();
        when(experienceRepository.findById(id)).thenReturn(Optional.of(exp));

        assertThatThrownBy(() -> experienceService.getExperience(owner, id))
                .isInstanceOf(ApiException.class)
                .hasMessage(ExperienceExceptions.FORBIDDEN_EXPERIENCE.getMessage());
    }

    @Test
    @DisplayName("updateExperience: 다른 사용자의 경험이면 FORBIDDEN_EXPERIENCE")
    void updateExperience_throwsWhenNotOwner() throws Exception {
        User other = User.create("other@test.com", "남");
        setBaseEntityId(other, otherUserId);
        Experience exp = Experience.create(other, sampleRequest());
        UUID id = UUID.randomUUID();
        when(experienceRepository.findById(id)).thenReturn(Optional.of(exp));

        assertThatThrownBy(() -> experienceService.updateExperience(owner, id, sampleRequest()))
                .isInstanceOf(ApiException.class)
                .hasMessage(ExperienceExceptions.FORBIDDEN_EXPERIENCE.getMessage());
    }

    @Test
    @DisplayName("deleteExperience: 본인 경험이면 repository.delete 호출 (Soft Delete는 @SQLDelete가 담당)")
    void deleteExperience_callsRepositoryDelete() {
        Experience exp = Experience.create(owner, sampleRequest());
        UUID id = UUID.randomUUID();
        when(experienceRepository.findById(id)).thenReturn(Optional.of(exp));

        experienceService.deleteExperience(owner, id);

        verify(experienceRepository, times(1)).delete(exp);
    }

    @Test
    @DisplayName("deleteExperience: 다른 사용자 경험은 삭제하지 않고 FORBIDDEN_EXPERIENCE")
    void deleteExperience_throwsWhenNotOwner() throws Exception {
        User other = User.create("other@test.com", "남");
        setBaseEntityId(other, otherUserId);
        Experience exp = Experience.create(other, sampleRequest());
        UUID id = UUID.randomUUID();
        when(experienceRepository.findById(id)).thenReturn(Optional.of(exp));

        assertThatThrownBy(() -> experienceService.deleteExperience(owner, id))
                .isInstanceOf(ApiException.class)
                .hasMessage(ExperienceExceptions.FORBIDDEN_EXPERIENCE.getMessage());
        verify(experienceRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Experience.update: STAR 구조와 기간 등 필드가 갱신된다")
    void experienceUpdate_replacesFields() {
        Experience exp = Experience.create(owner, sampleRequest());
        ExperienceRequest updated = new ExperienceRequest(
                ExperienceCategory.PARTTIME,
                State.WORKER,
                "경영학",
                "수정된 제목",
                LocalDate.of(2024, 1, 1),
                LocalDate.of(2024, 12, 31),
                new ExperienceRequest.StarStructure("새S", "새T", "새A", "새R")
        );

        exp.update(updated);

        org.assertj.core.api.Assertions.assertThat(exp.getExperienceTitle()).isEqualTo("수정된 제목");
        org.assertj.core.api.Assertions.assertThat(exp.getStarS()).isEqualTo("새S");
        org.assertj.core.api.Assertions.assertThat(exp.getExperienceCategory()).isEqualTo(ExperienceCategory.PARTTIME);
    }

    private ExperienceRequest sampleRequest() {
        return new ExperienceRequest(
                ExperienceCategory.INTERN,
                State.SENIOR,
                "컴퓨터공학",
                "백엔드 인턴",
                LocalDate.of(2023, 7, 1),
                LocalDate.of(2023, 12, 31),
                new ExperienceRequest.StarStructure("상황", "과제", "행동", "결과")
        );
    }

    private void setBaseEntityId(Object entity, UUID id) {
        try {
            Field field = entity.getClass().getSuperclass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
