package com.zentry.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "vacations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vacaciones {

    @Id
    private Long id;

    private Long empleadoId;
    private String fechaInicio;
    private String fechaFin;
    private Integer dias;
    private String estado;
    private String fechaSolicitud;
}