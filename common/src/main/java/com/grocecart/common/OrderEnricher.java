package com.grocecart.common;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Replaces Mongoose populate()/product look-ups. Orders are plain JSON maps whose
 * userId / addressId are raw ids; these methods swap in the referenced documents.
 */
@Component
public class OrderEnricher {
    private final AddressClient addresses;
    private final UserClient users;
    private final ProductClient products;

    public OrderEnricher(AddressClient addresses, UserClient users, ProductClient products) {
        this.addresses = addresses;
        this.users = users;
        this.products = products;
    }

    /** populate("addressId"); optionally also sets order.address like the customer/admin order views do. */
    public List<Map<String, Object>> populateAddress(List<Map<String, Object>> orders, boolean copyToAddressField) {
        Set<String> ids = new LinkedHashSet<>();
        for (var o : orders) if (o.get("addressId") != null) ids.add(String.valueOf(o.get("addressId")));
        Map<String, Map<String, Object>> found = addresses.lookup(ids);
        for (var o : orders) {
            Object ref = o.get("addressId");
            Map<String, Object> addr = ref == null ? null : found.get(String.valueOf(ref));
            o.put("addressId", addr);
            if (copyToAddressField && addr != null) o.put("address", addr);
        }
        return orders;
    }

    /** populate("userId", "name email mobile"). */
    public List<Map<String, Object>> populateUser(List<Map<String, Object>> orders) {
        Set<String> ids = new LinkedHashSet<>();
        for (var o : orders) if (o.get("userId") != null) ids.add(String.valueOf(o.get("userId")));
        Map<String, Map<String, Object>> found = users.lookup(ids);
        for (var o : orders) {
            Object ref = o.get("userId");
            o.put("userId", ref == null ? null : found.get(String.valueOf(ref)));
        }
        return orders;
    }

    /** Adds item.image (and item.productName when requested) from the product catalogue. */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> attachImages(List<Map<String, Object>> orders, boolean withProductName) {
        Set<String> ids = new LinkedHashSet<>();
        for (var o : orders) for (var item : items(o)) {
            String id = itemId(item);
            if (id != null) ids.add(id);
        }
        Map<String, Map<String, Object>> found = products.lookup(ids);
        for (var o : orders) for (var item : items(o)) {
            String id = itemId(item);
            Map<String, Object> info = id == null ? null : found.get(id);
            if (info != null) {
                item.put("image", info.get("image"));
                if (withProductName) item.put("productName", Js.truthy(info.get("name")) ? info.get("name") : item.get("name"));
            } else if (Js.isObjectId(id)) { // valid id but product no longer exists
                item.put("image", null);
                if (withProductName) item.put("productName", item.get("name"));
            }
        }
        return orders;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> items(Map<String, Object> order) {
        Object i = order.get("items");
        return i instanceof List<?> l ? (List<Map<String, Object>>) l : List.of();
    }

    private static String itemId(Map<String, Object> item) {
        Object id = Js.truthy(item.get("_id")) ? item.get("_id") : item.get("id");
        return id == null ? null : String.valueOf(id);
    }
}
