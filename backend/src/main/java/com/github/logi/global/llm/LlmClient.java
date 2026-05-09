package com.github.logi.global.llm;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.logi.global.llm.exception.LlmExceptions;
import com.github.logi.global.property.LlmProperty;
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
public class LlmClient {

    private static final String ANTHROPIC_VERSION = "bedrock-2023-05-31";

    private final BedrockRuntimeClient bedrockRuntimeClient;
    private final ObjectMapper objectMapper;
    private final LlmProperty llmProperty;

    public String invoke(String system, String user) {
        try {
            ClaudeRequest requestPayload = new ClaudeRequest(
                    ANTHROPIC_VERSION,
                    llmProperty.getMaxTokens(),
                    llmProperty.getTemperature(),
                    system,
                    List.of(new ClaudeMessage("user", user))
            );
            String body = objectMapper.writeValueAsString(requestPayload);

            InvokeModelResponse response = bedrockRuntimeClient.invokeModel(req -> req
                    .modelId(llmProperty.getModelId())
                    .contentType("application/json")
                    .accept("application/json")
                    .body(SdkBytes.fromUtf8String(body))
            );

            ClaudeResponse parsed = objectMapper.readValue(
                    response.body().asUtf8String(), ClaudeResponse.class);

            if (parsed == null
                    || parsed.content() == null
                    || parsed.content().isEmpty()
                    || parsed.content().get(0).text() == null) {
                throw LlmExceptions.LLM_GENERATION_FAILED.toException();
            }

            if (parsed.usage() != null) {
                log.info("[LLM] modelId={} inputTokens={} outputTokens={}",
                        llmProperty.getModelId(),
                        parsed.usage().inputTokens(),
                        parsed.usage().outputTokens());
            }

            return parsed.content().get(0).text();

        } catch (SdkException | JsonProcessingException e) {
            throw LlmExceptions.LLM_GENERATION_FAILED.toException(e);
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record ClaudeRequest(
            @JsonProperty("anthropic_version") String anthropicVersion,
            @JsonProperty("max_tokens") int maxTokens,
            Double temperature,
            String system,
            List<ClaudeMessage> messages
    ) {
    }

    private record ClaudeMessage(String role, String content) {
    }

    private record ClaudeResponse(List<ContentBlock> content, Usage usage) {
    }

    private record ContentBlock(String type, String text) {
    }

    private record Usage(
            @JsonProperty("input_tokens") int inputTokens,
            @JsonProperty("output_tokens") int outputTokens
    ) {
    }
}
