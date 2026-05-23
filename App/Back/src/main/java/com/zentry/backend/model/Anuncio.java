package com.zentry.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private String categoria;
    private String autorId;
    private String autorNombre;
    private String imagenBase64;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaExpiracion;
    private Boolean activo;
    private Boolean destacado;
    private List<String> vistoPor;
    private List<Comentario> comentarios = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Comentario {
        private String id;
        private String autorId;
        private String autorNombre;
        private String autorFoto;
        private String texto;
        private String respuestaAId;
        private String respuestaAAutor;
        private String respuestaATexto;
        private LocalDateTime fecha;
    }
}