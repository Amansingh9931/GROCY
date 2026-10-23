package com.grocecart.address;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication(scanBasePackages = {"com.grocecart.address", "com.grocecart.common"})
@EnableMongoAuditing
public class AddressServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AddressServiceApplication.class, args);
    }
}
