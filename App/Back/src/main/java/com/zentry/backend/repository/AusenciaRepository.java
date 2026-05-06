package com.zentry.backend.repository;

import com.zentry.backend.model.Ausencia;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AusenciaRepository extends MongoRepository<Ausencia, String> {

    List<Ausencia> findByEmpleadoId(String empleadoId);

    List<Ausencia> findByEstado(String estado);

    List<Ausencia> findByEmpleadoIdAndEstado(String empleadoId, String estado);
}
