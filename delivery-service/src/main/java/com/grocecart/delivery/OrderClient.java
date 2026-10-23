package com.grocecart.delivery;

import com.grocecart.common.ApiException;
import com.grocecart.common.InternalHttp;
import com.grocecart.common.Js;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/** Talks to order-service's internal envelope API ({ok, status, message, order(s)}). */
@Component
public class OrderClient {
    private static final ParameterizedTypeReference<Map<String, Object>> MAP = new ParameterizedTypeReference<>() {};
    private final RestClient http;

    public OrderClient(InternalHttp internal, @Value("${services.order.url:http://localhost:8005}") String url) {
        this.http = internal.create(url);
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> search(String status, String agentId, boolean unassigned, String sort) {
        Map<String, Object> r = http.get().uri(b -> {
            b.path("/internal/orders/search").queryParam("unassigned", unassigned).queryParam("sort", sort);
            if (status != null) b.queryParam("status", status);
            if (agentId != null) b.queryParam("agentId", agentId);
            return b.build();
        }).retrieve().body(MAP);
        Object orders = r == null ? null : r.get("orders");
        return orders instanceof List<?> l ? (List<Map<String, Object>>) l : new ArrayList<>();
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> find(String id) {
        Map<String, Object> r = http.get().uri("/internal/orders/{id}", id).retrieve().body(MAP);
        return r != null && Boolean.TRUE.equals(r.get("ok")) ? Optional.of((Map<String, Object>) r.get("order")) : Optional.empty();
    }

    public Map<String, Object> claim(String id, String agentId, String agentName) {
        return post("/internal/orders/{id}/claim", id, Js.map("agentId", agentId, "agentName", agentName));
    }

    public Map<String, Object> release(String id) { return post("/internal/orders/{id}/release", id, Js.map()); }

    public Map<String, Object> outForDelivery(String id) { return post("/internal/orders/{id}/out-for-delivery", id, Js.map()); }

    public Map<String, Object> deliver(String id, double commission) {
        return post("/internal/orders/{id}/deliver", id, Js.map("commission", commission));
    }

    /** Returns the order, or throws the business error order-service reported. */
    @SuppressWarnings("unchecked")
    private Map<String, Object> post(String path, String id, Map<String, Object> body) {
        Map<String, Object> r = http.post().uri(path, id).body(body).retrieve().body(MAP);
        if (r == null || !Boolean.TRUE.equals(r.get("ok"))) {
            int status = r != null && r.get("status") instanceof Number n ? n.intValue() : 500;
            String message = r != null && r.get("message") != null ? String.valueOf(r.get("message")) : "Order update failed";
            throw ApiException.fail(status, message);
        }
        return (Map<String, Object>) r.get("order");
    }
}
