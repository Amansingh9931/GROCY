package com.grocecart.cart;

import com.grocecart.common.AuthGuard;
import com.grocecart.common.InternalAuth;
import com.grocecart.common.Js;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Port of cartController.js. Admin (non-ObjectId) sessions get an empty cart, as before. */
@RestController
public class CartController {
    private static final Logger log = LoggerFactory.getLogger(CartController.class);
    private final CartRepository carts;
    private final AuthGuard guard;
    private final InternalAuth internal;

    public CartController(CartRepository carts, AuthGuard guard, InternalAuth internal) {
        this.carts = carts;
        this.guard = guard;
        this.internal = internal;
    }

    private static ResponseEntity<Map<String, Object>> fail(String m) {
        return ResponseEntity.status(500).body(Js.map("success", false, "message", m));
    }

    private Cart cartFor(String userId) {
        return carts.findById(userId).orElseGet(() -> {
            Cart c = new Cart();
            c.setUserId(userId);
            return c;
        });
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/api/cart/add")
    public ResponseEntity<Map<String, Object>> add(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> b0) {
        String userId = guard.user(req).id();
        try {
            Map<String, Object> b = Js.body(b0);
            String itemId = Js.str(b.get("itemId")), size = Js.str(b.get("size"));
            if ("admin".equals(userId)) return ResponseEntity.ok(Js.map("success", true, "message", "Added to cart"));

            Cart cart = cartFor(userId);
            Map<String, Object> bySize = (Map<String, Object>) cart.getCartData().computeIfAbsent(itemId, k -> new LinkedHashMap<String, Object>());
            bySize.put(size, (int) Js.num(bySize.get(size), 0) + 1);
            carts.save(cart);
            return ResponseEntity.ok(Js.map("success", true, "message", "Added to cart"));
        } catch (Exception e) {
            log.error("Add to cart error", e);
            return fail(e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/api/cart/update")
    public ResponseEntity<Map<String, Object>> update(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> b0) {
        String userId = guard.user(req).id();
        try {
            Map<String, Object> b = Js.body(b0);
            String itemId = Js.str(b.get("itemId")), size = Js.str(b.get("size"));
            Object quantity = b.get("quantity");
            if ("admin".equals(userId)) return ResponseEntity.ok(Js.map("success", true, "message", "Cart updated"));

            Cart cart = cartFor(userId);
            Map<String, Object> bySize = (Map<String, Object>) cart.getCartData().computeIfAbsent(itemId, k -> new LinkedHashMap<String, Object>());
            bySize.put(size, quantity);
            carts.save(cart);
            return ResponseEntity.ok(Js.map("success", true, "message", "Cart updated"));
        } catch (Exception e) {
            log.error("Update cart error", e);
            return fail(e.getMessage());
        }
    }

    @PostMapping("/api/cart/get")
    public ResponseEntity<Map<String, Object>> get(HttpServletRequest req) {
        String userId = guard.user(req).id();
        try {
            if ("admin".equals(userId)) return ResponseEntity.ok(Js.map("success", true, "cartData", Map.of()));
            return ResponseEntity.ok(Js.map("success", true, "cartData", cartFor(userId).getCartData()));
        } catch (Exception e) {
            log.error("Get cart error", e);
            return fail(e.getMessage());
        }
    }

    @PostMapping("/api/cart/set")
    public ResponseEntity<Map<String, Object>> set(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> b0) {
        String userId = guard.user(req).id();
        try {
            Object data = Js.body(b0).get("cartData");
            if ("admin".equals(userId)) return ResponseEntity.ok(Js.map("success", true, "message", "Cart synced"));

            Cart cart = cartFor(userId);
            @SuppressWarnings("unchecked")
            Map<String, Object> m = data instanceof Map<?, ?> mm ? (Map<String, Object>) mm : new LinkedHashMap<>();
            cart.setCartData(m);
            carts.save(cart);
            return ResponseEntity.ok(Js.map("success", true, "message", "Cart synced"));
        } catch (Exception e) {
            log.error("Set cart error", e);
            return fail(e.getMessage());
        }
    }

    /** Called by order-service after an order is placed. */
    @DeleteMapping("/internal/carts/{userId}")
    public Map<String, Object> clear(HttpServletRequest req, @PathVariable String userId) {
        internal.require(req);
        carts.deleteById(userId);
        return Js.map("success", true);
    }
}
