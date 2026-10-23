package com.grocecart.order;

import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface OrderRepository extends MongoRepository<Order, String> {
    @Query("{ 'userId': ?0 }")
    List<Order> findByUser(org.bson.types.ObjectId userId, Sort sort);
}
