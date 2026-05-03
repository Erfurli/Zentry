package com.zentry.backend.repository;

import com.zentry.backend.model.TokenRecuperacion;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface TokenRecuperacionRepository extends MongoRepository<TokenRecuperacion, String> {
    Optional<TokenRecuperacion> findByToken(String token);
}