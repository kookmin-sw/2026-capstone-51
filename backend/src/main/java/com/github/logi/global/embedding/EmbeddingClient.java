package com.github.logi.global.embedding;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.logi.global.embedding.exception.EmbeddingExceptions;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

import java.util.List;

@Component
@RequiredArgsConstructor
public class EmbeddingClient {

    private static final String MODEL_ID = "amazon.titan-embed-text-v2:0";

    private final BedrockRuntimeClient bedrockRuntimeClient;
    private final ObjectMapper objectMapper;

    public float[] embed(String text) {
        try {
            String requestBody = objectMapper.writeValueAsString(new TitanRequest(text));

            InvokeModelResponse response = bedrockRuntimeClient.invokeModel(req -> req
                    .modelId(MODEL_ID)
                    .contentType("application/json")
                    .accept("application/json")
                    .body(SdkBytes.fromUtf8String(requestBody))
            );

            TitanResponse parsed = objectMapper.readValue(
                    response.body().asUtf8String(), TitanResponse.class);

            if (parsed == null || parsed.embedding() == null || parsed.embedding().isEmpty()) {
                throw EmbeddingExceptions.EMBEDDING_FAILED.toException();
            }

            List<Float> values = parsed.embedding();
            float[] vector = new float[values.size()];
            for (int i = 0; i < vector.length; i++) {
                vector[i] = values.get(i);
            }
            return vector;
        } catch (SdkException | JsonProcessingException e) {
            throw EmbeddingExceptions.EMBEDDING_FAILED.toException();
        }
    }

    private record TitanRequest(String inputText) {
    }

    private record TitanResponse(List<Float> embedding) {
    }
}
