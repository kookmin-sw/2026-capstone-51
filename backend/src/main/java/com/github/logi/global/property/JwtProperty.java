package com.github.logi.global.property;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@Data
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperty {

    @NotBlank
    String key;

    @NotBlank
    Long tokenExpiration;

    @NotBlank
    Long refreshExpiration;
}
