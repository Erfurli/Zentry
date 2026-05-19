package com.zentry.backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Map;

@Document(collection = "preferencias_notificaciones")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PreferenciaNotificacion {
    @Id
    private String id;
    private String usuarioId;
    private Map<String, TipoPreferencia> preferencias;

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class TipoPreferencia {
        private boolean inApp;
        private boolean email;
    }
}