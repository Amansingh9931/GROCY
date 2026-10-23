package com.grocecart.address;

import com.grocecart.common.ApiException;
import com.grocecart.common.AuthGuard;
import com.grocecart.common.InternalAuth;
import com.grocecart.common.Js;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Port of addressController.js plus the internal look-ups order/delivery services need. */
@RestController
public class AddressController {
    private static final Logger log = LoggerFactory.getLogger(AddressController.class);
    private final AddressRepository repo;
    private final MongoTemplate mongo;
    private final AuthGuard guard;
    private final InternalAuth internal;

    public AddressController(AddressRepository repo, MongoTemplate mongo, AuthGuard guard, InternalAuth internal) {
        this.repo = repo;
        this.mongo = mongo;
        this.guard = guard;
        this.internal = internal;
    }

    private static ResponseEntity<Map<String, Object>> res(int s, boolean ok, String m) {
        return ResponseEntity.status(s).body(Js.map("success", ok, "message", m));
    }

    private static ObjectId oid(String s) { return Js.isObjectId(s) ? new ObjectId(s) : null; }

    private static String trim(Object o) { return o == null ? null : String.valueOf(o).trim(); }

    @SuppressWarnings("unchecked")
    private static Address.MapDetails mapDetails(Object o) {
        Address.MapDetails d = new Address.MapDetails();
        if (o instanceof Map<?, ?> m0) {
            Map<String, Object> m = (Map<String, Object>) m0;
            d.setLatitude(m.get("latitude") == null ? null : Js.num(m.get("latitude"), 0));
            d.setLongitude(m.get("longitude") == null ? null : Js.num(m.get("longitude"), 0));
            d.setLandmark(Js.truthy(m.get("landmark")) ? Js.str(m.get("landmark")) : "");
            d.setInstructions(Js.truthy(m.get("instructions")) ? Js.str(m.get("instructions")) : "");
        }
        return d;
    }

    private void clearDefaults(ObjectId userId) {
        mongo.updateMulti(Query.query(Criteria.where("userId").is(userId)), new Update().set("isDefault", false), Address.class);
    }

    @PostMapping("/api/address/add")
    public ResponseEntity<Map<String, Object>> add(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> b0) {
        String userId = guard.user(req).id();
        try {
            Map<String, Object> b = Js.body(b0);
            for (String f : List.of("firstName", "lastName", "email", "street", "city", "state", "zipcode", "country", "phone"))
                if (!Js.truthy(b.get(f))) return res(400, false, "All fields are required");

            ObjectId uid = oid(userId);
            if (uid == null) throw new IllegalArgumentException("Invalid user id");
            boolean isDefault = Js.truthy(b.get("isDefault"));
            if (isDefault) clearDefaults(uid);

            Address a = new Address();
            a.setUserId(userId);
            a.setFirstName(trim(b.get("firstName")));
            a.setLastName(trim(b.get("lastName")));
            a.setEmail(trim(b.get("email")).toLowerCase());
            a.setStreet(trim(b.get("street")));
            a.setCity(trim(b.get("city")));
            a.setState(trim(b.get("state")));
            a.setZipcode(trim(b.get("zipcode")));
            a.setCountry(trim(b.get("country")));
            a.setPhone(trim(b.get("phone")));
            a.setDefaultAddress(isDefault);
            a.setMapDetails(mapDetails(b.get("mapDetails")));
            a = repo.save(a);
            return ResponseEntity.status(201).body(Js.map("success", true, "message", "Address added successfully", "address", a));
        } catch (Exception e) {
            log.error("Add address error", e);
            return res(500, false, "Failed to add address");
        }
    }

    @GetMapping("/api/address/all")
    public ResponseEntity<Map<String, Object>> all(HttpServletRequest req) {
        String userId = guard.user(req).id();
        try {
            ObjectId uid = oid(userId);
            List<Address> list = uid == null ? List.of() : repo.findForUser(uid);
            return ResponseEntity.ok(Js.map("success", true, "addresses", list));
        } catch (Exception e) {
            log.error("Get addresses error", e);
            return res(500, false, "Failed to fetch addresses");
        }
    }

    @GetMapping("/api/address/default")
    public ResponseEntity<Map<String, Object>> getDefault(HttpServletRequest req) {
        String userId = guard.user(req).id();
        try {
            ObjectId uid = oid(userId);
            Optional<Address> a = uid == null ? Optional.empty() : repo.findDefault(uid);
            if (a.isEmpty()) return ResponseEntity.ok(Js.map("success", true, "address", null, "message", "No default address"));
            return ResponseEntity.ok(Js.map("success", true, "address", a.get()));
        } catch (Exception e) {
            log.error("Get default address error", e);
            return res(500, false, "Failed to fetch default address");
        }
    }

    @GetMapping("/api/address/{addressId}")
    public ResponseEntity<Map<String, Object>> byId(HttpServletRequest req, @PathVariable String addressId) {
        String userId = guard.user(req).id();
        try {
            ObjectId aid = oid(addressId), uid = oid(userId);
            Optional<Address> a = (aid == null || uid == null) ? Optional.empty() : repo.findOwned(aid, uid);
            if (a.isEmpty()) return res(404, false, "Address not found");
            return ResponseEntity.ok(Js.map("success", true, "address", a.get()));
        } catch (Exception e) {
            log.error("Get address error", e);
            return res(500, false, "Failed to fetch address");
        }
    }

    @PutMapping("/api/address/{addressId}")
    public ResponseEntity<Map<String, Object>> update(HttpServletRequest req, @PathVariable String addressId,
                                                     @RequestBody(required = false) Map<String, Object> b0) {
        String userId = guard.user(req).id();
        try {
            Map<String, Object> b = Js.body(b0);
            ObjectId aid = oid(addressId), uid = oid(userId);
            Address a = (aid == null || uid == null) ? null : repo.findOwned(aid, uid).orElse(null);
            if (a == null) return res(404, false, "Address not found");

            if (Js.truthy(b.get("isDefault")) && !a.isDefaultAddress()) clearDefaults(uid);

            // `value || existing` semantics from the original
            if (Js.truthy(b.get("firstName"))) a.setFirstName(trim(b.get("firstName")));
            if (Js.truthy(b.get("lastName"))) a.setLastName(trim(b.get("lastName")));
            if (Js.truthy(b.get("email"))) a.setEmail(trim(b.get("email")).toLowerCase());
            if (Js.truthy(b.get("street"))) a.setStreet(trim(b.get("street")));
            if (Js.truthy(b.get("city"))) a.setCity(trim(b.get("city")));
            if (Js.truthy(b.get("state"))) a.setState(trim(b.get("state")));
            if (Js.truthy(b.get("zipcode"))) a.setZipcode(trim(b.get("zipcode")));
            if (Js.truthy(b.get("country"))) a.setCountry(trim(b.get("country")));
            if (Js.truthy(b.get("phone"))) a.setPhone(trim(b.get("phone")));
            if (b.containsKey("isDefault")) a.setDefaultAddress(Js.truthy(b.get("isDefault")));
            if (Js.truthy(b.get("mapDetails"))) a.setMapDetails(mapDetails(b.get("mapDetails")));
            a = repo.save(a);
            return ResponseEntity.ok(Js.map("success", true, "message", "Address updated successfully", "address", a));
        } catch (Exception e) {
            log.error("Update address error", e);
            return res(500, false, "Failed to update address");
        }
    }

    @DeleteMapping("/api/address/{addressId}")
    public ResponseEntity<Map<String, Object>> delete(HttpServletRequest req, @PathVariable String addressId) {
        String userId = guard.user(req).id();
        try {
            ObjectId aid = oid(addressId), uid = oid(userId);
            Address a = (aid == null || uid == null) ? null : repo.findOwned(aid, uid).orElse(null);
            if (a == null) return res(404, false, "Address not found");

            boolean wasDefault = a.isDefaultAddress();
            repo.delete(a);
            if (wasDefault) { // promote another address to default
                List<Address> any = repo.findAnyForUser(uid, PageRequest.of(0, 1));
                if (!any.isEmpty()) {
                    any.get(0).setDefaultAddress(true);
                    repo.save(any.get(0));
                }
            }
            return res(200, true, "Address deleted successfully");
        } catch (Exception e) {
            log.error("Delete address error", e);
            return res(500, false, "Failed to delete address");
        }
    }

    @PostMapping("/api/address/{addressId}/set-default")
    public ResponseEntity<Map<String, Object>> setDefault(HttpServletRequest req, @PathVariable String addressId) {
        String userId = guard.user(req).id();
        try {
            ObjectId aid = oid(addressId), uid = oid(userId);
            Address a = (aid == null || uid == null) ? null : repo.findOwned(aid, uid).orElse(null);
            if (a == null) return res(404, false, "Address not found");
            clearDefaults(uid);
            a.setDefaultAddress(true);
            a = repo.save(a);
            return ResponseEntity.ok(Js.map("success", true, "message", "Default address updated", "address", a));
        } catch (Exception e) {
            log.error("Set default address error", e);
            return res(500, false, "Failed to set default address");
        }
    }

    // ------------- internal (service-to-service) -------------

    @GetMapping("/internal/addresses/{id}")
    public Address internalOwned(HttpServletRequest req, @PathVariable String id, @RequestParam String userId) {
        internal.require(req);
        ObjectId aid = oid(id), uid = oid(userId);
        if (aid == null || uid == null) throw ApiException.fail(404, "Address not found");
        return repo.findOwned(aid, uid).orElseThrow(() -> ApiException.fail(404, "Address not found"));
    }

    @PostMapping("/internal/addresses/lookup")
    public Map<String, Address> lookup(HttpServletRequest req, @RequestBody Map<String, Object> body) {
        internal.require(req);
        @SuppressWarnings("unchecked")
        List<Object> ids = (List<Object>) body.getOrDefault("ids", List.of());
        Map<String, Address> out = new LinkedHashMap<>();
        for (Address a : repo.findAllById(ids.stream().map(String::valueOf).filter(Js::isObjectId).toList()))
            out.put(a.getId(), a);
        return out;
    }
}
