package com.zentry.backend.repository;

import com.zentry.backend.entity.Conversacion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConversacionRepository extends MongoRepository<Conversacion, String> {
    List<Conversacion> findByParticipantesContaining(String usuarioId);
}