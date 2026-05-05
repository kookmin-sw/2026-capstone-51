package com.github.logi.global.sqs;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sqs.SqsAsyncClient;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class SqsMessagePublisher {

    private final SqsAsyncClient sqsAsyncClient;
    private final ObjectMapper objectMapper;

    @Value("${aws.sqs.star-embedding-queue-url}")
    private String starEmbeddingQueueUrl;

    public void publishStarEmbedding(UUID experienceId, String starText) {
        try {
            String messageBody = objectMapper.writeValueAsString(new StarEmbeddingMessage(experienceId, starText));
            sqsAsyncClient.sendMessage(req -> req
                    .queueUrl(starEmbeddingQueueUrl)
                    .messageBody(messageBody)
            ).whenComplete((resp, ex) -> {
                if (ex != null) {
                    log.error("SQS publish failed for experienceId={}", experienceId, ex);
                }
            });
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize SQS message for experienceId={}", experienceId, e);
        }
    }
}
