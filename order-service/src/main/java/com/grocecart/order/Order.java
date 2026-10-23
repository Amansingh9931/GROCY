package com.grocecart.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Getter
@Setter
@Document("orders")
public class Order {
    public static final List<String> STATUSES = List.of(
            "Pending", "Accepted", "Out for Delivery", "Delivered", "Cancelled", "Order Placed");

    @Id
    @JsonProperty("_id")
    private String id;
    @Field(targetType = FieldType.OBJECT_ID)
    private String userId;
    private List<Map<String, Object>> items;
    private double amount;
    @Field(targetType = FieldType.OBJECT_ID)
    private String addressId;
    private String status = "Pending";
    private String paymentMethod = "COD";
    private boolean payment = false;
    @Field(targetType = FieldType.OBJECT_ID)
    private String deliveryAgentId;
    private String deliveryAgentName;
    private Instant acceptedAt;
    private Instant deliveredAt;
    private Double commission;
    private Instant date = Instant.now();
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
}
