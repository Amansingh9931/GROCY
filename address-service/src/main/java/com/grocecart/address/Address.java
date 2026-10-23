package com.grocecart.address;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Getter
@Setter
@Document("addresses")
@CompoundIndex(def = "{'userId': 1, 'isDefault': -1}")
public class Address {
    @Id
    @JsonProperty("_id")
    private String id;
    @Field(targetType = FieldType.OBJECT_ID)
    private String userId;
    private String firstName;
    private String lastName;
    private String email;
    private String street;
    private String city;
    private String state;
    private String zipcode;
    private String country;
    private String phone;
    // field is named defaultAddress so Lombok's isDefaultAddress() maps back to the same JSON property
    @Field("isDefault")
    @JsonProperty("isDefault")
    private boolean defaultAddress = false;
    private MapDetails mapDetails = new MapDetails();
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    @Getter
    @Setter
    public static class MapDetails {
        private Double latitude;
        private Double longitude;
        private String landmark = "";
        private String instructions = "";
    }
}
