package com.grocecart.order;

import com.grocecart.common.InternalHttp;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class CartClient {
    private final RestClient http;

    public CartClient(InternalHttp internal, @Value("${services.cart.url:http://localhost:8003}") String url) {
        this.http = internal.create(url);
    }

    public void clear(String userId) {
        http.delete().uri("/internal/carts/{u}", userId).retrieve().toBodilessEntity();
    }
}
