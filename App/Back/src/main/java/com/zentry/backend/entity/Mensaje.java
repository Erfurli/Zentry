package com.zentry.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.annotation.Id;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "mensajes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mensaje {
    @Id
    private String id;
    private String conversacionId;
    private String autorId;
    @Field(targetType = FieldType.STRING)
    private String contenido;
    private String respuestaAId;
    private String respuestaAContenido;
    private String respuestaAAutorId;
    private LocalDateTime enviadoEn;
    private boolean eliminado = false;
    private LocalDateTime editadoEn;
    private boolean fijado = false;
    private List<String> menciones = new ArrayList<>();

}