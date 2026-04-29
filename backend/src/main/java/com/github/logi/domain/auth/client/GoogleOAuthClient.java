package com.github.logi.domain.auth.client;

import com.github.logi.domain.auth.dto.google.GoogleTokenResponse;
import com.github.logi.domain.auth.dto.google.GoogleUserInfoResponse;
import com.github.logi.domain.auth.exception.AuthExceptions;
import com.github.logi.global.exception.ApiException;
import com.github.logi.global.property.GoogleProperty;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
@RequiredArgsConstructor
public class GoogleOAuthClient {

    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
    private static final String GRANT_TYPE = "authorization_code";

    private final GoogleProperty googleProperty;
    private final RestClient restClient = RestClient.create();

    public String getAccessToken(String grantCode) {

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", grantCode);
        form.add("client_id", googleProperty.getId());
        form.add("client_secret", googleProperty.getSecret());
        form.add("redirect_uri", googleProperty.getRedirectUri());
        form.add("grant_type", GRANT_TYPE);

        GoogleTokenResponse response;
        try {
            response = restClient.post()
                    .uri(TOKEN_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .onStatus(status -> !status.is2xxSuccessful(),
                            (req, res) -> { throw AuthExceptions.GOOGLE_TOKEN_EXCHANGE_FAILED.toException(); })
                    .body(GoogleTokenResponse.class);
        } catch (ApiException e) {
            throw e;
        } catch (RestClientException e) {
            throw AuthExceptions.GOOGLE_TOKEN_EXCHANGE_FAILED.toException();
        }

        if (response == null || response.accessToken() == null) {
            throw AuthExceptions.GOOGLE_TOKEN_EXCHANGE_FAILED.toException();
        }

        return response.accessToken();
    }

    public GoogleUserInfoResponse getUserInfo(String googleAccessToken) {

        GoogleUserInfoResponse response;
        try {
            response = restClient.get()
                    .uri(USERINFO_URL)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + googleAccessToken)
                    .retrieve()
                    .onStatus(status -> !status.is2xxSuccessful(),
                            (req, res) -> { throw AuthExceptions.GOOGLE_USERINFO_FAILED.toException(); })
                    .body(GoogleUserInfoResponse.class);
        } catch (ApiException e) {
            throw e;
        } catch (RestClientException e) {
            throw AuthExceptions.GOOGLE_USERINFO_FAILED.toException();
        }

        if (response == null || response.email() == null) {
            throw AuthExceptions.GOOGLE_USERINFO_FAILED.toException();
        }

        return response;
    }
}
