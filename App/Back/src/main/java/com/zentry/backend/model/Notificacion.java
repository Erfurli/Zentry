package com.zentry.backend.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notificaciones")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notificacion {

    @Id
    private String id;

    private String usuarioDestinatarioId;
    private String titulo;
    private String mensaje;
    private String tipo;
    private boolean leida;
    private String ruta;
    private LocalDateTime fecha;
}