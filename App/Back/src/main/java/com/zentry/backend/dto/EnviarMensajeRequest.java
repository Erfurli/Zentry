package com.zentry.backend.dto;

import lombok.Data;

@Data
public class EnviarMensajeRequest {
    private String conversacionId;
    private String contenido;
    private String respuestaAId;
}