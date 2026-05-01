package com.zentry.backend.repository;

import com.zentry.backend.model.Asistencia;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface AsistenciaRepository extends MongoRepository<Asistencia, String> {
    List<Asistencia> findByEmpleadoId(String empleadoId);
    List<Asistencia> findByFecha(String fecha);
    Optional<Asistencia> findByEmpleadoIdAndFecha(String empleadoId, String fecha);
}