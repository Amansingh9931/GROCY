package com.grocecart.product;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/** Port of cacheService.js. Every failure degrades to "no cache", never to an error. */
@Service
public class CacheService {
    private static final Logger log = LoggerFactory.getLogger(CacheService.class);
    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;

    public CacheService(StringRedisTemplate redis, ObjectMapper mapper) {
        this.redis = redis;
        this.mapper = mapper;
    }

    public List<Object> get(String key) {
        try {
            String v = redis.opsForValue().get(key);
            return v == null ? null : mapper.readValue(v, new TypeReference<List<Object>>() {});
        } catch (Exception e) {
            log.warn("Cache read failed: {}", e.getMessage());
            return null;
        }
    }

    public void set(String key, Object value, long ttlSeconds) {
        try {
            redis.opsForValue().set(key, mapper.writeValueAsString(value), Duration.ofSeconds(ttlSeconds));
        } catch (Exception e) {
            log.warn("Cache write failed: {}", e.getMessage());
        }
    }

    public void delete(String key) {
        try {
            redis.delete(key);
        } catch (Exception e) {
            log.warn("Cache invalidation failed: {}", e.getMessage());
        }
    }
}
