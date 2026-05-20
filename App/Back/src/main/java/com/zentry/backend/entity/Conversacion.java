package com.zentry.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;

@Document(collection = "conversaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversacion {
    @Id
    private String id;
    private String nombre;
    private TipoConversacion tipo;
    private List<String> participantes = new ArrayList<>();
    private String creadorId;
    private LocalDateTime creadaEn;
}