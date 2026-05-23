package com.zentry.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "absences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ausencia {

    @Id
    private String id;

    private String empleadoId;
    private String fechaInicio;
    private String fechaFin;
    private Integer dias;
    private String tipo;
    private String estado;
    private String motivo;
    private String fechaSolicitud;

    private String justificanteBase64;
    private String justificanteNombre;
    private String justificanteTipo;
}