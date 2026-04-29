package com.github.logi.global.security.jwt;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.TokenExpiredException;
import com.github.logi.global.property.JwtProperty;
import com.github.logi.global.security.exception.SecurityExceptions;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class JwtUtil {

    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    private static final String CLAIM_ID = "id";
    private static final String CLAIM_TYPE = "type";

    private final JwtProperty jwtProperty;

    @Bean
    public Algorithm algorithm() {
        return Algorithm.HMAC256(jwtProperty.getKey());
    }

    public String extractToken(HttpServletRequest request) {

        String authorization = request.getHeader("Authorization");

        if (authorization != null && authorization.startsWith("Bearer ")) {

            return authorization.substring(7);

        } else return null;
    }

    public boolean validateToken(String token) {

        if (Objects.isNull(token)) {
            return false;
        }

        try {

            JWT.require(algorithm()).build().verify(token);
            return true;
        } catch (TokenExpiredException e) {

            throw SecurityExceptions.ACCESS_TOKEN_EXPIRED.toException();
        } catch (Exception e) {

            return false;
        }

    }

    public UUID extractUUID(String token) {

        return UUID.fromString(
                JWT.require(algorithm())
                        .build()
                        .verify(token)
                        .getClaim(CLAIM_ID)
                        .asString()
        );
    }

    public String extractType(String token) {

        return JWT.require(algorithm())
                .build()
                .verify(token)
                .getClaim(CLAIM_TYPE)
                .asString();
    }

    public boolean isAccessToken(String token) {
        return TYPE_ACCESS.equals(extractType(token));
    }

    public boolean isRefreshToken(String token) {
        return TYPE_REFRESH.equals(extractType(token));
    }

    public String generateAccessToken(UUID id) {
        return JWT.create()
                .withIssuedAt(Instant.now())
                .withExpiresAt(Instant.now().plus(jwtProperty.getTokenExpiration(), ChronoUnit.HOURS))
                .withClaim(CLAIM_ID, id.toString())
                .withClaim(CLAIM_TYPE, TYPE_ACCESS)
                .sign(algorithm());
    }

    public String generateRefreshToken(UUID id) {
        return JWT.create()
                .withIssuedAt(Instant.now())
                .withExpiresAt(Instant.now().plus(jwtProperty.getRefreshExpiration(), ChronoUnit.HOURS))
                .withClaim(CLAIM_ID, id.toString())
                .withClaim(CLAIM_TYPE, TYPE_REFRESH)
                .sign(algorithm());
    }

    public LocalDateTime getRefreshTokenExpiresAt() {
        return LocalDateTime.ofInstant(
                Instant.now().plus(jwtProperty.getRefreshExpiration(), ChronoUnit.HOURS),
                ZoneId.systemDefault()
        );
    }
}
