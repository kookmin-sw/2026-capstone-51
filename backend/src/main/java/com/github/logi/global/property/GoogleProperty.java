package com.github.logi.global.property;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@Data
@ConfigurationProperties(prefix = "google.client")
public class GoogleProperty {

    @NotBlank
    String id;

    @NotBlank
    String secret;

    @NotBlank
    String redirectUri;
}
