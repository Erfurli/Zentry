package com.zentry.backend.repository;

import com.zentry.backend.model.Equipo;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EquipoRepository extends MongoRepository<Equipo, String> {
    List<Equipo> findByDepartamentoIgnoreCase(String departamento);
}