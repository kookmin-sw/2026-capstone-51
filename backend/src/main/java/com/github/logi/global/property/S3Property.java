package com.github.logi.global.property;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@Data
@ConfigurationProperties(prefix = "aws.s3")
public class S3Property {

    @NotBlank
    private String bucket;

    @NotBlank
    private String region;

    @Positive
    private long uploadUrlExpirationMinutes;

    @Positive
    private long downloadUrlExpirationMinutes;
}
