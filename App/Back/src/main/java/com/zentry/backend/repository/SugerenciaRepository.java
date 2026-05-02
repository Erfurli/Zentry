package com.zentry.backend.repository;

import com.zentry.backend.model.SugerenciaVacaciones;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SugerenciaRepository extends MongoRepository<SugerenciaVacaciones, String> {
    List<SugerenciaVacaciones> findByEmpleadoId(String empleadoId);
    List<SugerenciaVacaciones> findByEmpleadoIdAndEstado(String empleadoId, String estado);
    List<SugerenciaVacaciones> findByVacacionesId(String vacacionesId);
}