package com.zentry.backend.repository;

import com.zentry.backend.model.Notificacion;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificacionRepository extends MongoRepository<Notificacion, String> {
    List<Notificacion> findByUsuarioDestinatarioIdOrderByFechaDesc(String usuarioDestinatarioId);
}