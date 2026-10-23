package com.grocecart.delivery;

import com.grocecart.common.ApiException;
import com.grocecart.common.AuthGuard;
import com.grocecart.common.Js;
import com.grocecart.common.OrderEnricher;
import com.grocecart.common.UserClient;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Port of deliveryController.js. */
@RestController
@RequestMapping("/api/delivery")
public class DeliveryController {
    private static final Logger log = LoggerFactory.getLogger(DeliveryController.class);
    private static final String ACTIVE = "Accepted,Out for Delivery";
    private static final double COMMISSION_RATE = 5; // percent

    private final OrderClient orders;
    private final UserClient users;
    private final OrderEnricher enricher;
    private final AuthGuard guard;

    public DeliveryController(OrderClient orders, UserClient users, OrderEnricher enricher, AuthGuard guard) {
        this.orders = orders;
        this.users = users;
        this.enricher = enricher;
        this.guard = guard;
    }

    private static ResponseEntity<Map<String, Object>> fail(int s, String m) {
        return ResponseEntity.status(s).body(Js.map("success", false, "message", m));
    }

    private static String idOf(Object o) { return o == null ? null : String.valueOf(o); }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) { return o instanceof Map<?, ?> ? (Map<String, Object>) o : null; }

    private static String userName(Map<String, Object> order) {
        Map<String, Object> u = asMap(order.get("userId"));
        return u != null && Js.truthy(u.get("name")) ? String.valueOf(u.get("name")) : "Unknown";
    }

    private List<Map<String, Object>> fullEnrich(List<Map<String, Object>> list, boolean productName) {
        enricher.populateAddress(list, false);
        enricher.populateUser(list);
        enricher.attachImages(list, productName);
        return list;
    }

    @GetMapping("/available-orders")
    public ResponseEntity<Map<String, Object>> available(HttpServletRequest req) {
        String agentId = guard.delivery(req).id();
        try {
            List<Map<String, Object>> active = orders.search(ACTIVE, agentId, false, "date");
            if (!active.isEmpty()) {
                return ResponseEntity.ok(Js.map("success", true, "orders", List.of(),
                        "activeOrder", idOf(active.get(0).get("_id")),
                        "message", "You already have an active delivery. Complete it before accepting a new one."));
            }
            List<Map<String, Object>> pending = fullEnrich(orders.search("Pending", null, true, "date"), true);
            List<Map<String, Object>> result = new ArrayList<>();
            for (Map<String, Object> o : pending) {
                if (o.get("addressId") == null) continue; // address was deleted
                o.put("userName", userName(o));
                result.add(o);
            }
            return ResponseEntity.ok(Js.map("success", true, "orders", result));
        } catch (Exception e) {
            log.error("Get available orders error", e);
            return fail(500, e.getMessage());
        }
    }

    @PostMapping("/accept-order")
    public ResponseEntity<Map<String, Object>> accept(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> b0) {
        String agentId = guard.delivery(req).id();
        try {
            String orderId = Js.str(Js.body(b0).get("orderId"));
            if (!Js.truthy(orderId)) return fail(400, "Order ID is required");

            if (!orders.search(ACTIVE, agentId, false, "date").isEmpty())
                return fail(400, "You already have an active delivery. Complete it first.");

            String agentName = users.find(agentId).map(u -> idOf(u.get("name"))).orElse(null);
            orders.claim(orderId, agentId, agentName); // atomic; throws the proper 400/404 on conflict
            return ResponseEntity.ok(Js.map("success", true, "message", "Order accepted successfully"));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Accept order error", e);
            return fail(500, e.getMessage());
        }
    }

    @PostMapping("/reject-order")
    public ResponseEntity<Map<String, Object>> reject(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> b0) {
        String agentId = guard.delivery(req).id();
        try {
            String orderId = Js.str(Js.body(b0).get("orderId"));
            Map<String, Object> order = orderId == null ? null : orders.find(orderId).orElse(null);
            if (order == null) return fail(404, "Order not found");
            if (!agentId.equals(idOf(order.get("deliveryAgentId")))) return fail(403, "Unauthorized");
            orders.release(orderId);
            return ResponseEntity.ok(Js.map("success", true, "message", "Order released back to pool"));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Reject order error", e);
            return fail(500, e.getMessage());
        }
    }

    @GetMapping("/active-delivery")
    public ResponseEntity<Map<String, Object>> active(HttpServletRequest req) {
        String agentId = guard.delivery(req).id();
        try {
            List<Map<String, Object>> list = orders.search(ACTIVE, agentId, false, "date");
            if (list.isEmpty()) return ResponseEntity.ok(Js.map("success", true, "order", null));

            Map<String, Object> order = fullEnrich(list.subList(0, 1), true).get(0);
            Map<String, Object> address = asMap(order.get("addressId"));
            Map<String, Object> md = address == null ? null : asMap(address.get("mapDetails"));
            if (md == null || !Js.truthy(md.get("latitude")) || !Js.truthy(md.get("longitude")))
                return ResponseEntity.ok(Js.map("success", false, "message", "Address location not available"));

            Map<String, Object> u = asMap(order.get("userId"));
            order.put("user", Js.map(
                    "name", u != null ? u.get("name") : "Unknown",
                    "email", u != null ? u.get("email") : "",
                    "phone", u != null && Js.truthy(u.get("mobile")) ? u.get("mobile") : address.get("phone")));
            return ResponseEntity.ok(Js.map("success", true, "order", order));
        } catch (Exception e) {
            log.error("Get active delivery error", e);
            return fail(500, e.getMessage());
        }
    }

    @PostMapping("/mark-out-for-delivery")
    public ResponseEntity<Map<String, Object>> outForDelivery(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> b0) {
        String agentId = guard.delivery(req).id();
        try {
            String orderId = Js.str(Js.body(b0).get("orderId"));
            Map<String, Object> order = orderId == null ? null : orders.find(orderId).orElse(null);
            if (order == null || !agentId.equals(idOf(order.get("deliveryAgentId")))) return fail(403, "Unauthorized");
            orders.outForDelivery(orderId);
            return ResponseEntity.ok(Js.map("success", true, "message", "Order is out for delivery"));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Mark out for delivery error", e);
            return fail(500, e.getMessage());
        }
    }

    @PostMapping("/mark-delivered")
    public ResponseEntity<Map<String, Object>> delivered(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> b0) {
        String agentId = guard.delivery(req).id();
        try {
            String orderId = Js.str(Js.body(b0).get("orderId"));
            Map<String, Object> order = orderId == null ? null : orders.find(orderId).orElse(null);
            if (order == null || !agentId.equals(idOf(order.get("deliveryAgentId")))) return fail(403, "Unauthorized");

            double commission = Js.num(order.get("amount"), 0) * COMMISSION_RATE / 100;
            orders.deliver(orderId, commission);
            users.addEarnings(agentId, commission);
            return ResponseEntity.ok(Js.map("success", true, "message", "Order delivered successfully", "commission", commission));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Mark delivered error", e);
            return fail(500, e.getMessage());
        }
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> history(HttpServletRequest req) {
        String agentId = guard.delivery(req).id();
        try {
            List<Map<String, Object>> list = fullEnrich(orders.search("Delivered", agentId, false, "deliveredAt"), false);
            List<Map<String, Object>> result = new ArrayList<>();
            for (Map<String, Object> o : list) {
                if (o.get("addressId") == null) continue;
                o.put("userName", userName(o));
                result.add(o);
            }
            return ResponseEntity.ok(Js.map("success", true, "orders", result));
        } catch (Exception e) {
            log.error("Get delivery history error", e);
            return fail(500, e.getMessage());
        }
    }

    @GetMapping("/earnings")
    public ResponseEntity<Map<String, Object>> earnings(HttpServletRequest req) {
        String agentId = guard.delivery(req).id();
        try {
            Map<String, Object> agent = users.earnings(agentId).orElse(null);
            if (agent == null) return fail(404, "Agent not found");
            return ResponseEntity.ok(Js.map("success", true, "earnings", Js.map(
                    "totalEarnings", agent.get("totalEarnings"),
                    "totalDeliveries", agent.get("totalDeliveries"),
                    "commissionRate", (int) COMMISSION_RATE)));
        } catch (Exception e) {
            log.error("Get earnings error", e);
            return fail(500, e.getMessage());
        }
    }
}
