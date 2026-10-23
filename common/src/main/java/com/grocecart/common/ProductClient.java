package com.grocecart.common;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ProductClient {
    private static final Logger log = LoggerFactory.getLogger(ProductClient.class);
    private static final ParameterizedTypeReference<Map<String, Map<String, Object>>> LOOKUP = new ParameterizedTypeReference<>() {};
    private final RestClient http;

    public ProductClient(InternalHttp internal, @Value("${services.product.url:http://localhost:8002}") String url) {
        this.http = internal.create(url);
    }

    /** id -> {image, name}. Best effort: the original code swallowed per-item lookup errors too. */
    public Map<String, Map<String, Object>> lookup(Collection<String> ids) {
        if (ids.isEmpty()) return Map.of();
        try {
            Map<String, Map<String, Object>> r = http.post().uri("/internal/products/lookup")
                    .body(Js.map("ids", List.copyOf(ids))).retrieve().body(LOOKUP);
            return r == null ? Map.of() : r;
        } catch (Exception e) {
            log.warn("Product lookup failed, continuing without images: {}", e.getMessage());
            return Map.of();
        }
    }
}
