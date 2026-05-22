package com.zentry.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MensajeDTO {
    private String id;
    private String conversacionId;
    private String autorId;
    private String autorNombre;
    private String contenido;
    private String respuestaAId;
    private String respuestaAContenido;
    private String respuestaAAutor;
    private Map<String, List<String>> reacciones;
    private LocalDateTime enviadoEn;
    private String foto;

    public void setAutorFoto(String foto) {
        this.foto = foto;
    }

    private LocalDateTime editadoEn;
    private boolean fijado;
    private List<String> menciones;
}