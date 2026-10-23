package com.grocecart.common;

import com.auth0.jwt.exceptions.JWTVerificationException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/** Ports of Middleware/Auth.js, adminAuth.js and deliveryAuth.js, including their exact messages. */
@Component
public class AuthGuard {
    private final JwtService jwt;

    public AuthGuard(JwtService jwt) { this.jwt = jwt; }

    private static String bearer(HttpServletRequest r) {
        String h = r.getHeader("Authorization");
        return (h != null && h.startsWith("Bearer ")) ? h.substring(7).trim() : null;
    }

    /** Any authenticated user. */
    public AuthUser user(HttpServletRequest r) {
        String t = bearer(r);
        if (t == null) throw ApiException.of(401, "Unauthorized");
        try { return jwt.verify(t); } catch (JWTVerificationException e) { throw ApiException.of(401, "Invalid token"); }
    }

    public AuthUser admin(HttpServletRequest r) {
        String t = bearer(r);
        if (t == null) throw ApiException.fail(401, "No authorization Login again");
        AuthUser u;
        try { u = jwt.verify(t); }
        catch (JWTVerificationException e) { throw ApiException.fail(401, "Invalid or expired admin session. Please log in again."); }
        if (!"admin".equals(u.role())) throw ApiException.fail(403, "Admin access only");
        return u;
    }

    /** deliveryBoy / delivery, plus admin for supervisory access. */
    public AuthUser delivery(HttpServletRequest r) {
        String t = bearer(r);
        if (t == null) throw ApiException.fail(401, "Authentication token missing. Please log in.");
        AuthUser u;
        try { u = jwt.verify(t); }
        catch (JWTVerificationException e) { throw ApiException.fail(401, "Session expired or invalid token. Please log in again."); }
        String role = u.role() == null ? "" : u.role().toLowerCase();
        if (!role.equals("deliveryboy") && !role.equals("delivery") && !role.equals("admin"))
            throw ApiException.fail(403, "Access denied. Delivery partner role required.");
        return u;
    }
}
