package com.zentry.backend.repository;

import com.zentry.backend.model.Vacaciones;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface VacacionesRepository extends MongoRepository<Vacaciones, Long> {
    List<Vacaciones> findByEmpleadoId(Long empleadoId);
    List<Vacaciones> findByEstado(String estado);
}