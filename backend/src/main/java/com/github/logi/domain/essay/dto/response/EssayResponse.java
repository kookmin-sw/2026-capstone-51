package com.github.logi.domain.essay.dto.response;

import com.github.logi.domain.essay.entity.Essay;
import com.github.logi.domain.essay.entity.Progress;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

@Schema(description = "자소서 목록 항목")
public record EssayResponse(
        @Schema(description = "지원 회사명", example = "토스")
        String companyName,

        @Schema(description = "희망 직무", example = "백엔드 엔지니어")
        String wishJob,

        @Schema(description = "진행 상태", example = "IN_PROGRESS")
        Progress progress,

        @Schema(description = "최종 수정 일자", example = "2026-05-01")
        LocalDate updatedAt
) {
    public static EssayResponse from(Essay essay) {
        return new EssayResponse(
                essay.getCompanyName(),
                essay.getWishJob(),
                essay.getProgress(),
                essay.getUpdatedAt().toLocalDate()
        );
    }
}
