package com.grocecart.cart;

import java.util.LinkedHashMap;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** One cart per user (previously the cartData field on the user document). _id == userId. */
@Getter
@Setter
@Document("carts")
public class Cart {
    @Id
    private String userId;
    /** { itemId: { size: quantity } } */
    private Map<String, Object> cartData = new LinkedHashMap<>();
}
