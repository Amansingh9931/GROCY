package com.grocecart.user;

import com.grocecart.common.ApiException;
import com.grocecart.common.InternalAuth;
import com.grocecart.common.Js;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.web.bind.annotation.*;

/** Service-to-service API. Not routed by the gateway; requires X-Internal-Key. */
@RestController
@RequestMapping("/internal/users")
public class InternalUserController {
    private final UserRepository users;
    private final MongoTemplate mongo;
    private final InternalAuth internal;

    public InternalUserController(UserRepository users, MongoTemplate mongo, InternalAuth internal) {
        this.users = users;
        this.mongo = mongo;
        this.internal = internal;
    }

    /** Equivalent of populate("userId", "name email mobile"). */
    private static Map<String, Object> brief(User u) {
        Map<String, Object> m = Js.map("_id", u.getId(), "name", u.getName(), "email", u.getEmail());
        if (u.getMobile() != null) m.put("mobile", u.getMobile());
        return m;
    }

    @PostMapping("/lookup")
    public Map<String, Map<String, Object>> lookup(HttpServletRequest req, @RequestBody Map<String, Object> body) {
        internal.require(req);
        @SuppressWarnings("unchecked")
        List<Object> ids = (List<Object>) body.getOrDefault("ids", List.of());
        Map<String, Map<String, Object>> out = new LinkedHashMap<>();
        for (User u : users.findAllById(ids.stream().map(String::valueOf).filter(Js::isObjectId).toList()))
            out.put(u.getId(), brief(u));
        return out;
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(HttpServletRequest req, @PathVariable String id) {
        internal.require(req);
        User u = users.findById(id).orElseThrow(() -> ApiException.fail(404, "User not found"));
        Map<String, Object> m = brief(u);
        m.put("role", u.getRole());
        return m;
    }

    @PostMapping("/{id}/earnings")
    public Map<String, Object> addEarnings(HttpServletRequest req, @PathVariable String id, @RequestBody Map<String, Object> body) {
        internal.require(req);
        double commission = Js.num(body.get("commission"), 0);
        // atomic $inc, so concurrent deliveries cannot lose an update
        var result = mongo.updateFirst(Query.query(Criteria.where("id").is(id)),
                new Update().inc("totalEarnings", commission).inc("totalDeliveries", 1), User.class);
        if (result.getMatchedCount() == 0) throw ApiException.fail(404, "User not found");
        return Js.map("success", true);
    }

    @GetMapping("/{id}/earnings")
    public Map<String, Object> earnings(HttpServletRequest req, @PathVariable String id) {
        internal.require(req);
        User u = users.findById(id).orElseThrow(() -> ApiException.fail(404, "Agent not found"));
        return Js.map("name", u.getName(), "email", u.getEmail(),
                "totalEarnings", u.getTotalEarnings(), "totalDeliveries", u.getTotalDeliveries());
    }
}
