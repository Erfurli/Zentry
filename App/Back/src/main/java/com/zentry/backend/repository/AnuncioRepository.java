package com.zentry.backend.repository;

import com.zentry.backend.model.Anuncio;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnuncioRepository extends MongoRepository<Anuncio, String> {


    List<Anuncio> findByActivoTrueOrderByDestacadoDescFechaCreacionDesc();


}