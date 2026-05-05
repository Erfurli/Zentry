package com.zentry.backend.repository;

import com.zentry.backend.entity.Mensaje;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MensajeRepository extends MongoRepository<Mensaje, String> {
    List<Mensaje> findByConversacionIdAndEliminadoFalseOrderByEnviadoEnAsc(String conversacionId);
}