package com.grocecart.common;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@Component
public class UserClient {
    private static final ParameterizedTypeReference<Map<String, Map<String, Object>>> LOOKUP = new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<Map<String, Object>> MAP = new ParameterizedTypeReference<>() {};
    private final RestClient http;

    public UserClient(InternalHttp internal, @Value("${services.user.url:http://localhost:8001}") String url) {
        this.http = internal.create(url);
    }

    /** id -> {_id, name, email, mobile?}. Unknown ids are simply absent. */
    public Map<String, Map<String, Object>> lookup(Collection<String> ids) {
        if (ids.isEmpty()) return Map.of();
        Map<String, Map<String, Object>> r = http.post().uri("/internal/users/lookup")
                .body(Js.map("ids", List.copyOf(ids))).retrieve().body(LOOKUP);
        return r == null ? Map.of() : r;
    }

    public Optional<Map<String, Object>> find(String id) {
        try {
            return Optional.ofNullable(http.get().uri("/internal/users/{id}", id).retrieve().body(MAP));
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        }
    }

    public void addEarnings(String id, double commission) {
        http.post().uri("/internal/users/{id}/earnings", id).body(Js.map("commission", commission)).retrieve().toBodilessEntity();
    }

    public Optional<Map<String, Object>> earnings(String id) {
        try {
            return Optional.ofNullable(http.get().uri("/internal/users/{id}/earnings", id).retrieve().body(MAP));
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        }
    }
}
