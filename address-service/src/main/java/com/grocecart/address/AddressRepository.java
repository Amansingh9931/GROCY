package com.grocecart.address;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface AddressRepository extends MongoRepository<Address, String> {
    @Query(value = "{ 'userId': ?0 }", sort = "{ 'isDefault': -1, 'createdAt': -1 }")
    List<Address> findForUser(org.bson.types.ObjectId userId);

    @Query("{ '_id': ?0, 'userId': ?1 }")
    Optional<Address> findOwned(org.bson.types.ObjectId id, org.bson.types.ObjectId userId);

    @Query("{ 'userId': ?0, 'isDefault': true }")
    Optional<Address> findDefault(org.bson.types.ObjectId userId);

    @Query("{ 'userId': ?0 }")
    List<Address> findAnyForUser(org.bson.types.ObjectId userId, org.springframework.data.domain.Pageable page);
}
