package com.github.logi.global.property;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@Data
@ConfigurationProperties(prefix = "app.llm")
public class LlmProperty {

    @NotBlank
    String modelId;

    @Positive
    Integer maxTokens;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("1.0")
    Double temperature;
}
