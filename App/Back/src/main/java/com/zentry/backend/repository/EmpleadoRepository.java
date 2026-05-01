package com.zentry.backend.repository;

import com.zentry.backend.model.Empleado;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface EmpleadoRepository extends MongoRepository<Empleado, String> {
    List<Empleado> findByActivo(Boolean activo);
    List<Empleado> findByDepartamento(String departamento);
}