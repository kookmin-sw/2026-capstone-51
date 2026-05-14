package com.github.logi.domain.essay.service;

import com.github.logi.domain.essay.dto.request.EssayCreateRequest;
import com.github.logi.domain.essay.dto.request.EssayQuestionCreateRequest;
import com.github.logi.domain.essay.dto.request.EssayResultUpdateRequest;
import com.github.logi.domain.essay.dto.request.EssayUpdateRequest;
import com.github.logi.domain.essay.dto.response.EssayCreateResponse;
import com.github.logi.domain.essay.dto.response.EssayQuestionCreateResponse;
import com.github.logi.domain.essay.entity.Essay;
import com.github.logi.domain.essay.entity.EssayQuestion;
import com.github.logi.domain.essay.entity.Progress;
import com.github.logi.domain.essay.exception.EssayExceptions;
import com.github.logi.domain.essay.repository.EssayQuestionRepository;
import com.github.logi.domain.essay.repository.EssayRepository;
import com.github.logi.domain.experience.dto.request.ExperienceRequest;
import com.github.logi.domain.experience.entity.Experience;
import com.github.logi.domain.experience.entity.ExperienceCategory;
import com.github.logi.domain.experience.exception.ExperienceExceptions;
import com.github.logi.domain.experience.repository.ExperienceRepository;
import com.github.logi.domain.user.entity.State;
import com.github.logi.domain.user.entity.User;
import com.github.logi.global.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EssayServiceTest {

    @Mock
    private EssayRepository essayRepository;

    @Mock
    private EssayQuestionRepository essayQuestionRepository;

    @Mock
    private ExperienceRepository experienceRepository;

    @InjectMocks
    private EssayService essayService;

    private User owner;
    private UUID ownerId;
    private UUID otherUserId;

    @BeforeEach
    void setUp() {
        owner = User.create("owner@test.com", "주인");
        ownerId = UUID.randomUUID();
        otherUserId = UUID.randomUUID();
        setBaseEntityId(owner, ownerId);
    }

    @Test
    @DisplayName("createEssay: 새 자소서를 저장하고 ID를 반환한다")
    void createEssay_savesAndReturnsId() {
        Essay essay = Essay.create(owner, "삼성전자", "백엔드 개발자", "공통 요구사항");
        UUID essayId = UUID.randomUUID();
        setBaseEntityId(essay, essayId);
        when(essayRepository.save(any(Essay.class))).thenReturn(essay);

        EssayCreateResponse response = essayService.createEssay(
                owner,
                new EssayCreateRequest("삼성전자", "백엔드 개발자", "공통 요구사항")
        );

        assertThat(response.essayId()).isEqualTo(essayId);
    }

    @Test
    @DisplayName("createQuestion: 본인 자소서면 문항을 생성하고 연관 경험을 매핑한다")
    void createQuestion_createsWithExperiences() {
        Essay essay = Essay.create(owner, "삼성전자", "백엔드", "요구사항");
        UUID essayId = UUID.randomUUID();
        setBaseEntityId(essay, essayId);
        when(essayRepository.findById(essayId)).thenReturn(Optional.of(essay));

        UUID expId = UUID.randomUUID();
        Experience experience = Experience.create(owner, sampleExperienceRequest());
        setBaseEntityId(experience, expId);
        when(experienceRepository.findAllById(List.of(expId))).thenReturn(List.of(experience));

        EssayQuestion savedQuestion = EssayQuestion.create(essay, 1, "Q", "A", 500, List.of(experience));
        UUID questionId = UUID.randomUUID();
        setBaseEntityId(savedQuestion, questionId);
        when(essayQuestionRepository.save(any(EssayQuestion.class))).thenReturn(savedQuestion);

        EssayQuestionCreateRequest request = new EssayQuestionCreateRequest(
                1, "Q", "A", 500,
                List.of(new EssayQuestionCreateRequest.RelatedExperience(expId))
        );

        EssayQuestionCreateResponse response = essayService.createQuestion(owner, essayId, request);

        assertThat(response.questionId()).isEqualTo(questionId);
        verify(essayQuestionRepository, times(1)).save(any(EssayQuestion.class));
    }

    @Test
    @DisplayName("createQuestion: relatedExperience가 null이면 빈 리스트로 처리한다")
    void createQuestion_handlesNullRelatedExperience() {
        Essay essay = Essay.create(owner, "삼성전자", "백엔드", "요구사항");
        UUID essayId = UUID.randomUUID();
        setBaseEntityId(essay, essayId);
        when(essayRepository.findById(essayId)).thenReturn(Optional.of(essay));

        EssayQuestion savedQuestion = EssayQuestion.create(essay, 1, "Q", "A", 500, List.of());
        setBaseEntityId(savedQuestion, UUID.randomUUID());
        when(essayQuestionRepository.save(any(EssayQuestion.class))).thenReturn(savedQuestion);

        EssayQuestionCreateRequest request = new EssayQuestionCreateRequest(1, "Q", "A", 500, null);

        essayService.createQuestion(owner, essayId, request);

        verify(experienceRepository, never()).findAllById(anyList());
    }

    @Test
    @DisplayName("createQuestion: 요청한 경험 ID 일부가 존재하지 않으면 EXPERIENCE_NOT_FOUND")
    void createQuestion_throwsWhenSomeExperienceMissing() {
        Essay essay = Essay.create(owner, "삼성전자", "백엔드", "요구사항");
        UUID essayId = UUID.randomUUID();
        setBaseEntityId(essay, essayId);
        when(essayRepository.findById(essayId)).thenReturn(Optional.of(essay));

        UUID expId1 = UUID.randomUUID();
        UUID expId2 = UUID.randomUUID();
        when(experienceRepository.findAllById(List.of(expId1, expId2))).thenReturn(List.of());

        EssayQuestionCreateRequest request = new EssayQuestionCreateRequest(
                1, "Q", "A", 500,
                List.of(
                        new EssayQuestionCreateRequest.RelatedExperience(expId1),
                        new EssayQuestionCreateRequest.RelatedExperience(expId2)
                )
        );

        assertThatThrownBy(() -> essayService.createQuestion(owner, essayId, request))
                .isInstanceOf(ApiException.class)
                .hasMessage(ExperienceExceptions.EXPERIENCE_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("createQuestion: 다른 사용자의 자소서면 FORBIDDEN_ESSAY")
    void createQuestion_throwsWhenNotOwner() {
        User other = User.create("other@test.com", "남");
        setBaseEntityId(other, otherUserId);
        Essay essay = Essay.create(other, "삼성전자", "백엔드", "요구사항");
        UUID essayId = UUID.randomUUID();
        setBaseEntityId(essay, essayId);
        when(essayRepository.findById(essayId)).thenReturn(Optional.of(essay));

        EssayQuestionCreateRequest request = new EssayQuestionCreateRequest(1, "Q", "A", 500, null);

        assertThatThrownBy(() -> essayService.createQuestion(owner, essayId, request))
                .isInstanceOf(ApiException.class)
                .hasMessage(EssayExceptions.FORBIDDEN_ESSAY.getMessage());
    }

    @Test
    @DisplayName("deleteEssay: 본인 자소서면 매핑·문항·자소서 순으로 삭제한다")
    void deleteEssay_deletesInOrder() {
        Essay essay = Essay.create(owner, "삼성전자", "백엔드", "요구사항");
        UUID essayId = UUID.randomUUID();
        setBaseEntityId(essay, essayId);
        when(essayRepository.findById(essayId)).thenReturn(Optional.of(essay));

        essayService.deleteEssay(owner, essayId);

        verify(essayQuestionRepository, times(1)).deleteExperienceLinksByEssayId(essayId);
        verify(essayQuestionRepository, times(1)).deleteAllByEssayIdNative(essayId);
        verify(essayRepository, times(1)).deleteById(essayId);
    }

    @Test
    @DisplayName("deleteEssay: 자소서 없으면 ESSAY_NOT_FOUND")
    void deleteEssay_throwsWhenNotFound() {
        UUID essayId = UUID.randomUUID();
        when(essayRepository.findById(essayId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> essayService.deleteEssay(owner, essayId))
                .isInstanceOf(ApiException.class)
                .hasMessage(EssayExceptions.ESSAY_NOT_FOUND.getMessage());
        verify(essayRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("updateEssay: 본인 자소서면 메타 정보가 갱신된다")
    void updateEssay_updatesFields() {
        Essay essay = Essay.create(owner, "이전회사", "이전직무", "이전요구");
        UUID essayId = UUID.randomUUID();
        setBaseEntityId(essay, essayId);
        when(essayRepository.findById(essayId)).thenReturn(Optional.of(essay));

        essayService.updateEssay(owner, essayId,
                new EssayUpdateRequest("새회사", "새직무", "새요구"));

        assertThat(essay.getCompanyName()).isEqualTo("새회사");
        assertThat(essay.getWishJob()).isEqualTo("새직무");
        assertThat(essay.getGlobalReq()).isEqualTo("새요구");
    }

    @Test
    @DisplayName("updateResult: 진행 상태(progress)를 변경한다")
    void updateResult_changesProgress() {
        Essay essay = Essay.create(owner, "삼성전자", "백엔드", "요구사항");
        UUID essayId = UUID.randomUUID();
        setBaseEntityId(essay, essayId);
        when(essayRepository.findById(essayId)).thenReturn(Optional.of(essay));

        essayService.updateResult(owner, essayId, new EssayResultUpdateRequest(Progress.PASS));

        assertThat(essay.getProgress()).isEqualTo(Progress.PASS);
    }

    @Test
    @DisplayName("Essay.create: 초기 진행 상태는 IN_PROGRESS")
    void essayCreate_defaultsToInProgress() {
        Essay essay = Essay.create(owner, "회사", "직무", "요구");

        assertThat(essay.getProgress()).isEqualTo(Progress.IN_PROGRESS);
    }

    private ExperienceRequest sampleExperienceRequest() {
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
