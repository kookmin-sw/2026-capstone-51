package com.github.logi.domain.essay.service;

import com.github.logi.domain.essay.dto.request.EssayCreateRequest;
import com.github.logi.domain.essay.dto.response.EssayCreateResponse;
import com.github.logi.domain.essay.dto.response.EssayDetailResponse;
import com.github.logi.domain.essay.dto.response.EssayListResponse;
import com.github.logi.domain.essay.entity.Essay;
import com.github.logi.domain.essay.exception.EssayExceptions;
import com.github.logi.domain.essay.repository.EssayRepository;
import com.github.logi.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EssayService {

    private final EssayRepository essayRepository;

    @Transactional
    public EssayCreateResponse createEssay(User user, EssayCreateRequest request) {
        Essay essay = Essay.create(user, request.companyName(), request.wishJob(), request.globalReq());
        return EssayCreateResponse.from(essayRepository.save(essay));
    }

    public EssayListResponse getEssays(User user) {
        return EssayListResponse.from(essayRepository.findAllByUser(user));
    }

    public EssayDetailResponse getEssay(User user, UUID essayId) {
        Essay essay = essayRepository.findByIdWithQuestions(essayId)
                .orElseThrow(EssayExceptions.ESSAY_NOT_FOUND::toException);

        if (!essay.getUser().getId().equals(user.getId())) {
            throw EssayExceptions.FORBIDDEN_ESSAY.toException();
        }

        return EssayDetailResponse.from(essay);
    }
}
