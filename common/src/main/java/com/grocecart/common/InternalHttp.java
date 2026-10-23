package com.grocecart.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class InternalHttp {
    private final String key;

    public InternalHttp(@Value("${internal.key}") String key) { this.key = key; }

    public RestClient create(String baseUrl) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(3000);
        f.setReadTimeout(10000);
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(f)
                .defaultHeader(InternalAuth.HEADER, key)
                .build();
    }
}
