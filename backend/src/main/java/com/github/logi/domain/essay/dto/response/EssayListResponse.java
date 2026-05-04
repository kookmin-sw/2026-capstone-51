package com.github.logi.domain.essay.dto.response;

import com.github.logi.domain.essay.entity.Essay;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "자소서 목록 응답")
public record EssayListResponse(
        @Schema(description = "자소서 목록")
        List<EssayResponse> essays
) {
    public static EssayListResponse from(List<Essay> essays) {
        return new EssayListResponse(
                essays.stream()
                        .map(EssayResponse::from)
                        .toList()
        );
    }
}
