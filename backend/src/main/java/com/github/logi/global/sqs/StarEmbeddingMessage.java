package com.github.logi.global.sqs;

import java.util.UUID;

public record StarEmbeddingMessage(UUID experienceId, String starText) {
}
