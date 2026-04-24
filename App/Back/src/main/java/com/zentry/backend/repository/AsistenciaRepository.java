package com.zentry.backend.repository;

import com.zentry.backend.model.Asistencia;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AsistenciaRepository extends MongoRepository<Asistencia, Long> {
    List<Asistencia> findByEmpleadoId(Long empleadoId);
    List<Asistencia> findByFecha(String fecha);
}