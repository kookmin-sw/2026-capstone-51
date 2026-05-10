package com.github.logi.global.embedding;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.logi.global.embedding.exception.EmbeddingExceptions;
import com.github.logi.global.property.EmbeddingProperty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmbeddingClient {

    private final BedrockRuntimeClient bedrockRuntimeClient;
    private final ObjectMapper objectMapper;
    private final EmbeddingProperty embeddingProperty;

    public float[] embed(String text) {
        try {
            String requestBody = objectMapper.writeValueAsString(new TitanRequest(text));

            InvokeModelResponse response = bedrockRuntimeClient.invokeModel(req -> req
                    .modelId(embeddingProperty.getModelId())
                    .contentType("application/json")
                    .accept("application/json")
                    .body(SdkBytes.fromUtf8String(requestBody))
            );

            TitanResponse parsed = objectMapper.readValue(
                    response.body().asUtf8String(), TitanResponse.class);

            if (parsed == null || parsed.embedding() == null || parsed.embedding().isEmpty()) {
                throw EmbeddingExceptions.EMBEDDING_FAILED.toException();
            }

            log.info("[EMBEDDING] modelId={} inputTokens={}",
                    embeddingProperty.getModelId(),
                    parsed.inputTextTokenCount());

            List<Float> values = parsed.embedding();
            float[] vector = new float[values.size()];
            for (int i = 0; i < vector.length; i++) {
                vector[i] = values.get(i);
            }
            return vector;
        } catch (SdkException | JsonProcessingException e) {
            throw EmbeddingExceptions.EMBEDDING_FAILED.toException(e);
        }
    }

    private record TitanRequest(String inputText) {
    }

    private record TitanResponse(
            List<Float> embedding,
            @JsonProperty("inputTextTokenCount") Integer inputTextTokenCount
    ) {
    }
}
