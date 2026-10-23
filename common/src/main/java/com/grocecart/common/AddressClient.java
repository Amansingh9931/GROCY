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
public class AddressClient {
    private static final ParameterizedTypeReference<Map<String, Map<String, Object>>> LOOKUP = new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<Map<String, Object>> MAP = new ParameterizedTypeReference<>() {};
    private final RestClient http;

    public AddressClient(InternalHttp internal, @Value("${services.address.url:http://localhost:8004}") String url) {
        this.http = internal.create(url);
    }

    public Map<String, Map<String, Object>> lookup(Collection<String> ids) {
        if (ids.isEmpty()) return Map.of();
        Map<String, Map<String, Object>> r = http.post().uri("/internal/addresses/lookup")
                .body(Js.map("ids", List.copyOf(ids))).retrieve().body(LOOKUP);
        return r == null ? Map.of() : r;
    }

    /** The address, only if it belongs to userId. */
    public Optional<Map<String, Object>> findOwned(String addressId, String userId) {
        try {
            return Optional.ofNullable(http.get().uri("/internal/addresses/{id}?userId={u}", addressId, userId).retrieve().body(MAP));
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        }
    }
}
