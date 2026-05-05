package com.zentry.backend.repository;

import com.zentry.backend.entity.Reaccion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReaccionRepository extends MongoRepository<Reaccion, String> {
    Optional<Reaccion> findByMensajeIdAndUsuarioIdAndEmoji(String mensajeId, String usuarioId, String emoji);
    List<Reaccion> findByMensajeId(String mensajeId);
}