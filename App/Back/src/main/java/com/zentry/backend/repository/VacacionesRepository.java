package com.zentry.backend.repository;

import com.zentry.backend.model.Vacaciones;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface VacacionesRepository extends MongoRepository<Vacaciones, String> {
    List<Vacaciones> findByEmpleadoId(String empleadoId);
    List<Vacaciones> findByEstado(String estado);
}