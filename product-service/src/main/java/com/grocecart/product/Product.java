package com.grocecart.product;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document("products")
public class Product {
    @Id
    @JsonProperty("_id")
    private String id;
    private String name;
    private String description;
    private double price;
    private List<String> imageUrl = new ArrayList<>();
    private String category;
    private int stock;
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
}
