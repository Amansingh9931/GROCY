package com.grocecart.order;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grocecart.common.AddressClient;
import com.grocecart.common.AuthGuard;
import com.grocecart.common.Js;
import com.grocecart.common.OrderEnricher;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Port of orderController.js (customer + admin order endpoints). */
@RestController
public class OrderController {
    private static final Logger log = LoggerFactory.getLogger(OrderController.class);
    private static final Sort NEWEST = Sort.by(Sort.Direction.DESC, "date", "createdAt");

    private final OrderRepository repo;
    private final AddressClient addresses;
    private final CartClient carts;
    private final OrderEnricher enricher;
    private final AuthGuard guard;
    private final ObjectMapper mapper;

    public OrderController(OrderRepository repo, AddressClient addresses, CartClient carts,
                           OrderEnricher enricher, AuthGuard guard, ObjectMapper mapper) {
        this.repo = repo;
        this.addresses = addresses;
        this.carts = carts;
        this.enricher = enricher;
        this.guard = guard;
        this.mapper = mapper;
    }

    private List<Map<String, Object>> toMaps(List<Order> orders) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Order o : orders) out.add(mapper.convertValue(o, new TypeReference<LinkedHashMap<String, Object>>() {}));
        return out;
    }

    private static ResponseEntity<Map<String, Object>> fail(String m) {
        return ResponseEntity.ok(Js.map("success", false, "message", m));
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/api/order/place")
    public ResponseEntity<Map<String, Object>> place(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> b0) {
        String userId = guard.user(req).id();
        try {
            Map<String, Object> b = Js.body(b0);
            String addressId = Js.str(b.get("addressId"));
            if (!Js.truthy(addressId) || addresses.findOwned(addressId, userId).isEmpty())
                return ResponseEntity.status(404).body(Js.map("success", false, "message", "Address not found"));
            if (!(b.get("items") instanceof List<?>) || !(b.get("amount") instanceof Number || b.get("amount") instanceof String))
                return ResponseEntity.status(400).body(Js.map("success", false, "message", "items and amount are required"));

            Order order = new Order();
            order.setUserId(userId);
            order.setItems((List<Map<String, Object>>) b.get("items"));
            order.setAmount(Js.num(b.get("amount"), 0));
            order.setAddressId(addressId);
            order.setPaymentMethod("COD");
            order.setPayment(false);
            order.setStatus("Pending");
            order = repo.save(order);

            try {
                carts.clear(userId);
            } catch (Exception e) { // the order is already saved; a stale cart must not fail the request
                log.warn("Could not clear cart for user {}: {}", userId, e.getMessage());
            }
            return ResponseEntity.ok(Js.map("success", true, "message", "Order Placed", "orderId", order.getId()));
        } catch (Exception e) {
            log.error("Place order error", e);
            return fail(e.getMessage());
        }
    }

    @GetMapping("/api/order/me")
    public ResponseEntity<Map<String, Object>> userOrders(HttpServletRequest req) {
        String userId = guard.user(req).id();
        try {
            List<Order> orders = Js.isObjectId(userId) ? repo.findByUser(new ObjectId(userId), NEWEST) : List.of();
            List<Map<String, Object>> maps = toMaps(orders);
            enricher.populateAddress(maps, true);
            enricher.attachImages(maps, false);
            return ResponseEntity.ok(Js.map("success", true, "orders", maps));
        } catch (Exception e) {
            log.error("User orders error", e);
            return fail(e.getMessage());
        }
    }

    @GetMapping("/api/admin/orders")
    public ResponseEntity<Map<String, Object>> allOrders(HttpServletRequest req) {
        guard.admin(req);
        try {
            List<Map<String, Object>> maps = toMaps(repo.findAll(NEWEST));
            enricher.populateAddress(maps, true);
            enricher.attachImages(maps, false);
            return ResponseEntity.ok(Js.map("success", true, "orders", maps));
        } catch (Exception e) {
            log.error("All orders error", e);
            return fail(e.getMessage());
        }
    }

    @PostMapping("/api/admin/orders/update-status")
    public ResponseEntity<Map<String, Object>> updateStatus(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> b0) {
        guard.admin(req);
        try {
            Map<String, Object> b = Js.body(b0);
            String orderId = Js.str(b.get("orderId")), status = Js.str(b.get("status"));
            if (!Order.STATUSES.contains(status)) return fail("Invalid status");
            Order o = repo.findById(String.valueOf(orderId)).orElse(null);
            if (o == null) return fail("Order not found");
            o.setStatus(status);
            repo.save(o);
            return ResponseEntity.ok(Js.map("success", true, "message", "Status Updated"));
        } catch (Exception e) {
            log.error("Update status error", e);
            return fail(e.getMessage());
        }
    }

    @GetMapping("/api/admin/debug/orders")
    public ResponseEntity<Map<String, Object>> debugOrders(HttpServletRequest req) {
        guard.admin(req);
        try {
            List<Order> all = repo.findAll(NEWEST);
            List<Map<String, Object>> sample = new ArrayList<>();
            for (Order o : all) sample.add(Js.map("_id", o.getId(), "status", o.getStatus(), "date", o.getDate(),
                    "userId", o.getUserId(), "addressId", o.getAddressId(), "deliveryAgentId", o.getDeliveryAgentId()));
            return ResponseEntity.ok(Js.map("success", true, "totalOrders", all.size(), "orders", sample));
        } catch (Exception e) {
            return fail(e.getMessage());
        }
    }
}
