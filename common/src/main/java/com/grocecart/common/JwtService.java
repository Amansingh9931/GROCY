package com.grocecart.common;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * HS256 tokens with claims {id, role}, identical to the Node backend, so tokens and the shared
 * JWT_SECRET stay interchangeable. (java-jwt is used because, unlike jjwt, it does not reject short secrets.)
 */
@Component
public class JwtService {
    private final Algorithm algorithm;
    private final long expiresMs;

    public JwtService(@Value("${jwt.secret}") String secret, @Value("${jwt.expires:7d}") String expires) {
        this.algorithm = Algorithm.HMAC256(secret);
        this.expiresMs = Js.durationMillis(expires);
    }

    public String sign(String id, String role) {
        long now = System.currentTimeMillis();
        return JWT.create()
                .withClaim("id", id)
                .withClaim("role", role)
                .withIssuedAt(new Date(now))
                .withExpiresAt(new Date(now + expiresMs))
                .sign(algorithm);
    }

    public AuthUser verify(String token) throws JWTVerificationException {
        DecodedJWT d = JWT.require(algorithm).build().verify(token);
        return new AuthUser(d.getClaim("id").asString(), d.getClaim("role").asString());
    }
}
