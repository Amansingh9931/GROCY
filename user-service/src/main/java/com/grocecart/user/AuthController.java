package com.grocecart.user;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.grocecart.common.ApiException;
import com.grocecart.common.AuthGuard;
import com.grocecart.common.Js;
import com.grocecart.common.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.Map;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

/** Port of userController.js (auth + profile). Response shapes and messages match the Node API. */
@RestController
@RequestMapping("/api/user")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private static final Pattern EMAIL = Pattern.compile("^[A-Za-z0-9._%+'\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$");

    private final UserRepository users;
    private final JwtService jwt;
    private final AuthGuard guard;
    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder(10);
    private final GoogleIdTokenVerifier googleVerifier;
    private final String adminEmail;
    private final String adminPassword;

    public AuthController(UserRepository users, JwtService jwt, AuthGuard guard,
                          @Value("${google.client-id:}") String googleClientId,
                          @Value("${admin.email:}") String adminEmail,
                          @Value("${admin.password:}") String adminPassword) {
        this.users = users;
        this.jwt = jwt;
        this.guard = guard;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.googleVerifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId)).build();
    }

    static Map<String, Object> publicUser(User u) {
        return Js.map("_id", u.getId(), "name", u.getName(), "email", u.getEmail(),
                "address", u.getAddress(), "role", u.getRole(), "status", u.getStatus());
    }

    private static ResponseEntity<Map<String, Object>> msg(int status, String m) {
        return ResponseEntity.status(status).body(Js.map("message", m));
    }

    private static Long toMobile(Object o) {
        if (!Js.truthy(o)) return null;
        if (o instanceof Number n) return n.longValue();
        return Long.parseLong(String.valueOf(o).trim());
    }

    @PostMapping("/google-signin")
    public ResponseEntity<Map<String, Object>> googleLogin(@RequestBody(required = false) Map<String, Object> b) {
        try {
            String credential = Js.str(Js.body(b).get("credential"));
            if (!Js.truthy(credential)) return msg(400, "Google token missing");

            GoogleIdToken idToken = googleVerifier.verify(credential);
            if (idToken == null) throw new IllegalStateException("Invalid Google token");
            GoogleIdToken.Payload p = idToken.getPayload();
            String email = p.getEmail().toLowerCase().trim();

            User user = users.findByEmail(email).orElseGet(() -> {
                User u = new User();
                u.setName((String) p.get("name"));
                u.setEmail(email);
                u.setPassword("google-auth");
                u.setAuthProvider("google");
                u.setRole("user");
                return users.save(u);
            });
            String token = jwt.sign(user.getId(), user.getRole());
            return ResponseEntity.ok(Js.map("success", true, "token", token, "user", user));
        } catch (Exception e) {
            log.error("Google Login Error", e);
            return msg(500, "Google login failed");
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> register(@RequestBody(required = false) Map<String, Object> b0) {
        try {
            Map<String, Object> b = Js.body(b0);
            String name = Js.str(b.get("name")), email = Js.str(b.get("email")), password = Js.str(b.get("password"));
            if (!Js.truthy(name) || !Js.truthy(email) || !Js.truthy(password)) return msg(400, "All fields required");
            if (!EMAIL.matcher(email).matches()) return msg(400, "Invalid email");

            String normalized = email.toLowerCase().trim();
            if (users.findByEmail(normalized).isPresent()) return msg(409, "Email already registered");

            Long mobile = toMobile(b.get("mobile"));
            if (mobile != null && users.findFirstByMobile(mobile).isPresent())
                return msg(409, "Mobile number already registered");

            String role = Js.str(b.get("role"));
            if ("admin".equals(role)) return msg(403, "Admin registration blocked");

            User u = new User();
            u.setName(name);
            u.setEmail(normalized);
            u.setPassword(bcrypt.encode(password));
            u.setMobile(mobile);
            u.setAddress(Js.truthy(b.get("address")) ? Js.str(b.get("address")) : "");
            u.setRole("deliveryBoy".equals(role) ? "deliveryBoy" : "user");
            u.setAuthProvider("manual");
            u.setStatus("active");
            u = users.save(u);

            String token = jwt.sign(u.getId(), u.getRole());
            return ResponseEntity.status(201).body(Js.map("success", true, "token", token, "user", publicUser(u)));
        } catch (Exception e) {
            log.error("Register Error", e);
            return msg(500, "Registration failed");
        }
    }

    @PostMapping({"/signin", "/login"})
    public ResponseEntity<Map<String, Object>> login(@RequestBody(required = false) Map<String, Object> b0) {
        try {
            Map<String, Object> b = Js.body(b0);
            String email = Js.str(b.get("email")), password = Js.str(b.get("password"));

            // admin login (credentials come from the environment, as before)
            if (!adminEmail.isBlank() && email.equalsIgnoreCase(adminEmail) && password != null && password.equals(adminPassword)) {
                String token = jwt.sign("admin", "admin");
                return ResponseEntity.ok(Js.map("success", true, "token", token,
                        "user", Js.map("name", "Admin", "email", email, "role", "admin")));
            }

            User user = users.findByEmail(email.toLowerCase().trim()).orElse(null);
            if (user == null) return msg(404, "User not found");

            if ("inactive".equals(user.getStatus()))
                return ResponseEntity.status(403).body(Js.map("message", "Your account is inactive. Please contact support.", "status", "inactive"));
            if ("banned".equals(user.getStatus()))
                return ResponseEntity.status(403).body(Js.map("message", "Your account has been banned. You cannot login.", "status", "banned"));
            if ("google".equals(user.getAuthProvider())) return msg(400, "Login with Google");

            if (password == null || !bcrypt.matches(password, user.getPassword())) return msg(401, "Invalid credentials");

            String token = jwt.sign(user.getId(), user.getRole());
            return ResponseEntity.ok(Js.map("success", true, "token", token, "user", publicUser(user)));
        } catch (Exception e) {
            log.error("Login Error", e);
            return msg(500, "Login failed");
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> b0) {
        var auth = guard.user(req);
        try {
            Map<String, Object> b = Js.body(b0);
            User user = users.findById(auth.id()).orElse(null);
            if (user == null) return ResponseEntity.ok(Js.map("success", true, "user", null));
            // Mongoose ignores undefined keys: only fields present in the body are updated.
            if (b.containsKey("name")) user.setName(Js.str(b.get("name")));
            if (b.containsKey("mobile")) user.setMobile(toMobile(b.get("mobile")));
            if (b.containsKey("address")) user.setAddress(Js.str(b.get("address")));
            users.save(user);
            return ResponseEntity.ok(Js.map("success", true, "user", user));
        } catch (Exception e) {
            log.error("Update Profile Error", e);
            return msg(500, "Profile update failed");
        }
    }

    @PostMapping({"/forgot-password", "/reset-password"})
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody(required = false) Map<String, Object> b0) {
        try {
            Map<String, Object> b = Js.body(b0);
            String email = Js.str(b.get("email"));
            String finalPassword = Js.truthy(b.get("newPassword")) ? Js.str(b.get("newPassword")) : Js.str(b.get("password"));

            if (!Js.truthy(email) || !Js.truthy(finalPassword))
                return fail(400, "Email and new password are required");
            if (!EMAIL.matcher(email).matches()) return fail(400, "Please enter a valid email address");
            if (finalPassword.length() < 6) return fail(400, "New password must be at least 6 characters long");

            String normalized = email.toLowerCase().trim();
            if (!adminEmail.isBlank() && normalized.equals(adminEmail.toLowerCase().trim()))
                return fail(403, "Security Restriction: Administrator password cannot be reset via public forgot password. Please update server environment variables directly.");

            User user = users.findByEmail(normalized).orElse(null);
            if (user == null) return fail(404, "No registered account found with this email");
            if ("admin".equals(user.getRole()))
                return fail(403, "Security Restriction: Administrator accounts cannot be reset via forgot password.");

            user.setPassword(bcrypt.encode(finalPassword));
            if ("google".equals(user.getAuthProvider())) user.setAuthProvider("manual");
            users.save(user);
            return ResponseEntity.ok(Js.map("success", true, "message", "Password reset successfully! You can now log in with your new password."));
        } catch (Exception e) {
            log.error("Forgot Password Error", e);
            return fail(500, "Failed to reset password. Please try again.");
        }
    }

    private static ResponseEntity<Map<String, Object>> fail(int status, String m) {
        return ResponseEntity.status(status).body(Js.map("success", false, "message", m));
    }
}
