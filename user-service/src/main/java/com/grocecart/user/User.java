package com.grocecart.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document("users")
public class User {
    @Id
    @JsonProperty("_id")
    private String id;
    private String name;
    @Indexed(unique = true)
    private String email;
    @JsonIgnore // equivalent of .select("-password")
    private String password;
    private Long mobile;
    private String address = "";
    private String role = "user";          // user | admin | deliveryBoy
    private String status = "active";      // active | inactive | banned
    private String authProvider = "manual"; // manual | google
    private double totalEarnings = 0;
    private int totalDeliveries = 0;
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
}
