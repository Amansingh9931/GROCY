package com.grocecart.user;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findFirstByMobile(Long mobile);
    List<User> findByRoleOrderByCreatedAtDesc(String role);
    long countByRole(String role);
}
