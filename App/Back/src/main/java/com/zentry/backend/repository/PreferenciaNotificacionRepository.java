package com.zentry.backend.repository;

import com.zentry.backend.entity.PreferenciaNotificacion;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface PreferenciaNotificacionRepository extends MongoRepository<PreferenciaNotificacion, String> {
    Optional<PreferenciaNotificacion> findByUsuarioId(String usuarioId);
}