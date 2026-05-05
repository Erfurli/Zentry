package com.zentry.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.Id;



@Document(collection = "reacciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reaccion {
    @Id
    private String id;
    private String mensajeId;
    private String usuarioId;
    private String emoji;
}
