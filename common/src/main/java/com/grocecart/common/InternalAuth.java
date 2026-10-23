package com.grocecart.common;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Service-to-service calls (/internal/**) must carry the shared X-Internal-Key. The gateway never routes /internal. */
@Component
public class InternalAuth {
    public static final String HEADER = "X-Internal-Key";
    private final byte[] key;

    public InternalAuth(@Value("${internal.key}") String key) {
        this.key = key.getBytes(StandardCharsets.UTF_8);
    }

    public void require(HttpServletRequest r) {
        String h = r.getHeader(HEADER);
        if (h == null || !MessageDigest.isEqual(key, h.getBytes(StandardCharsets.UTF_8)))
            throw ApiException.fail(403, "Forbidden");
    }
}
