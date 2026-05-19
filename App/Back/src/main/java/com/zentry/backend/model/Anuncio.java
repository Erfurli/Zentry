package com.zentry.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "anuncios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Anuncio {

    @Id
    private String id;

    private String titulo;
    private String contenido;
    private String categoria;       // IMPORTANTE, GENERAL, EVENTO, URGENTE
    private String autorId;
    private String autorNombre;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaExpiracion; // null = sin expiración
    private boolean activo;
    private boolean destacado;      // se muestra en banner superior
    private List<String> vistoPor;  // ids de empleados que lo han visto
}