package com.github.logi.global.property;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
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

    @NotEmpty
    List<String> allowedRedirectUriHosts;
}
