package com.github.logi.global.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@EnableCaching
@Configuration
public class CacheConfig {

    public static final String USER_STATS_CACHE = "userStats";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(USER_STATS_CACHE);
        manager.setCaffeineSpec(
                com.github.benmanes.caffeine.cache.CaffeineSpec.parse("maximumSize=500,expireAfterWrite=10m")
        );
        return manager;
    }
}
