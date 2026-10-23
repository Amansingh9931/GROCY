package com.grocecart.order;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grocecart.common.InternalAuth;
import com.grocecart.common.Js;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.web.bind.annotation.*;

/**
 * State-transition API used by delivery-service. Every response is HTTP 200 with an envelope
 * {ok, status?, message?, order?/orders?} so callers never have to interpret transport errors as business errors.
 * Transitions are single atomic Mongo updates, which closes the double-accept race in the original code.
 */
@RestController
@RequestMapping("/internal/orders")
public class InternalOrderController {
    private final MongoTemplate mongo;
    private final ObjectMapper mapper;
    private final InternalAuth internal;

    public InternalOrderController(MongoTemplate mongo, ObjectMapper mapper, InternalAuth internal) {
        this.mongo = mongo;
        this.mapper = mapper;
        this.internal = internal;
    }

    private Map<String, Object> toMap(Order o) {
        return mapper.convertValue(o, new TypeReference<LinkedHashMap<String, Object>>() {});
    }

    private static Map<String, Object> error(int status, String message) {
        return Js.map("ok", false, "status", status, "message", message);
    }

    private Map<String, Object> okOrder(Order o) {
        return Js.map("ok", true, "order", toMap(o));
    }

    /** status=A,B  agentId=X  unassigned=true  sort=date|deliveredAt */
    @GetMapping("/search")
    public Map<String, Object> search(HttpServletRequest req,
                                      @RequestParam(required = false) String status,
                                      @RequestParam(required = false) String agentId,
                                      @RequestParam(defaultValue = "false") boolean unassigned,
                                      @RequestParam(defaultValue = "date") String sort) {
        internal.require(req);
        Criteria c = new Criteria();
        List<Criteria> parts = new ArrayList<>();
        if (status != null && !status.isBlank()) parts.add(Criteria.where("status").in((Object[]) status.split(",")));
        if (agentId != null) {
            if (!Js.isObjectId(agentId)) return Js.map("ok", true, "orders", List.of());
            parts.add(Criteria.where("deliveryAgentId").is(new ObjectId(agentId)));
        }
        if (unassigned) parts.add(Criteria.where("deliveryAgentId").is(null));
        Query q = parts.isEmpty() ? new Query() : new Query(c.andOperator(parts.toArray(new Criteria[0])));
        q.with("deliveredAt".equals(sort)
                ? Sort.by(Sort.Direction.DESC, "deliveredAt")
                : Sort.by(Sort.Direction.DESC, "date", "createdAt"));
        List<Map<String, Object>> out = new ArrayList<>();
        for (Order o : mongo.find(q, Order.class)) out.add(toMap(o));
        return Js.map("ok", true, "orders", out);
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(HttpServletRequest req, @PathVariable String id) {
        internal.require(req);
        Order o = Js.isObjectId(id) ? mongo.findById(id, Order.class) : null;
        return o == null ? error(404, "Order not found") : okOrder(o);
    }

    /** Atomically assigns a Pending, unassigned order to an agent. */
    @PostMapping("/{id}/claim")
    public Map<String, Object> claim(HttpServletRequest req, @PathVariable String id, @RequestBody Map<String, Object> body) {
        internal.require(req);
        if (!Js.isObjectId(id)) return error(404, "Order not found");
        String agentId = Js.str(body.get("agentId"));
        if (!Js.isObjectId(agentId)) return error(403, "Only registered delivery partners can accept orders");

        Query q = new Query(new Criteria().andOperator(
                Criteria.where("id").is(id),
                Criteria.where("status").is("Pending"),
                Criteria.where("deliveryAgentId").is(null)));
        Update u = new Update()
                .set("deliveryAgentId", new ObjectId(agentId))
                .set("deliveryAgentName", Js.str(body.get("agentName")))
                .set("status", "Accepted")
                .set("acceptedAt", Instant.now());
        Order claimed = mongo.findAndModify(q, u, FindAndModifyOptions.options().returnNew(true), Order.class);
        if (claimed != null) return okOrder(claimed);

        Order existing = mongo.findById(id, Order.class);
        if (existing == null) return error(404, "Order not found");
        if (existing.getDeliveryAgentId() != null) return error(400, "Order already accepted by another agent");
        return error(400, "Order is no longer available");
    }

    /** Agent gives the order back to the pool. */
    @PostMapping("/{id}/release")
    public Map<String, Object> release(HttpServletRequest req, @PathVariable String id) {
        internal.require(req);
        Order o = Js.isObjectId(id) ? mongo.findById(id, Order.class) : null;
        if (o == null) return error(404, "Order not found");
        o.setDeliveryAgentId(null);
        o.setDeliveryAgentName(null);
        o.setStatus("Pending");
        o.setAcceptedAt(null);
        return okOrder(mongo.save(o));
    }

    @PostMapping("/{id}/out-for-delivery")
    public Map<String, Object> outForDelivery(HttpServletRequest req, @PathVariable String id) {
        internal.require(req);
        Order o = Js.isObjectId(id) ? mongo.findById(id, Order.class) : null;
        if (o == null) return error(404, "Order not found");
        o.setStatus("Out for Delivery");
        return okOrder(mongo.save(o));
    }

    @PostMapping("/{id}/deliver")
    public Map<String, Object> deliver(HttpServletRequest req, @PathVariable String id, @RequestBody Map<String, Object> body) {
        internal.require(req);
        Order o = Js.isObjectId(id) ? mongo.findById(id, Order.class) : null;
        if (o == null) return error(404, "Order not found");
        o.setStatus("Delivered");
        o.setDeliveredAt(Instant.now());
        o.setCommission(Js.num(body.get("commission"), 0));
        return okOrder(mongo.save(o));
    }
}
