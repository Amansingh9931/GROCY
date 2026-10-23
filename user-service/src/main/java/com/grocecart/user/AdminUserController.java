package com.grocecart.user;

import com.grocecart.common.AuthGuard;
import com.grocecart.common.Js;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Admin user-management endpoints (served at /api/admin/stats, /users/*, /user/*). */
@RestController
@RequestMapping("/api/admin")
public class AdminUserController {
    private static final Logger log = LoggerFactory.getLogger(AdminUserController.class);
    private final UserRepository users;
    private final AuthGuard guard;

    public AdminUserController(UserRepository users, AuthGuard guard) {
        this.users = users;
        this.guard = guard;
    }

    private static ResponseEntity<Map<String, Object>> fail(int s, String m) {
        return ResponseEntity.status(s).body(Js.map("success", false, "message", m));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats(HttpServletRequest req) {
        guard.admin(req);
        try {
            long u = users.countByRole("user"), d = users.countByRole("deliveryBoy"), a = users.countByRole("admin");
            return ResponseEntity.ok(Js.map("success", true, "stats",
                    Js.map("totalUsers", u, "totalDeliveryBoys", d, "totalAdmins", a, "totalAccounts", u + d + a)));
        } catch (Exception e) {
            log.error("Get Admin Stats Error", e);
            return fail(500, "Failed to fetch stats");
        }
    }

    @GetMapping("/users/{role}")
    public ResponseEntity<Map<String, Object>> byRole(HttpServletRequest req, @PathVariable String role) {
        guard.admin(req);
        if (!List.of("user", "deliveryBoy").contains(role)) return fail(400, "Invalid role");
        try {
            List<User> list = users.findByRoleOrderByCreatedAtDesc(role);
            return ResponseEntity.ok(Js.map("success", true, "count", list.size(), "users", list));
        } catch (Exception e) {
            log.error("Get Users By Role Error", e);
            return fail(500, "Failed to fetch users");
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> details(HttpServletRequest req, @PathVariable String userId) {
        guard.admin(req);
        try {
            return users.findById(userId)
                    .map(u -> ResponseEntity.ok(Js.map("success", true, "user", u)))
                    .orElseGet(() -> fail(404, "User not found"));
        } catch (Exception e) {
            log.error("Get User Details Error", e);
            return fail(500, "Failed to fetch user details");
        }
    }

    @PostMapping("/users/status")
    public ResponseEntity<Map<String, Object>> changeStatus(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> b0) {
        guard.admin(req);
        try {
            Map<String, Object> b = Js.body(b0);
            String userId = Js.str(b.get("userId")), status = Js.str(b.get("status"));
            if (!Js.truthy(userId) || !Js.truthy(status)) return fail(400, "User ID and status required");
            if (!List.of("active", "inactive", "banned").contains(status))
                return fail(400, "Invalid status. Must be active, inactive, or banned");
            User u = users.findById(userId).orElse(null);
            if (u == null) return fail(404, "User not found");
            u.setStatus(status);
            users.save(u);
            return ResponseEntity.ok(Js.map("success", true, "message", "User status changed to " + status, "user", u));
        } catch (Exception e) {
            log.error("Change User Status Error", e);
            return fail(500, "Failed to change user status");
        }
    }
}
