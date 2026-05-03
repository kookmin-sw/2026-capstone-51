package com.github.logi.domain.essay.dto.response;

import com.github.logi.domain.essay.entity.Essay;
import java.util.UUID;

public record EssayCreateResponse(UUID essayId) {

    public static EssayCreateResponse from(Essay essay) {
        return new EssayCreateResponse(essay.getId());
    }
}
