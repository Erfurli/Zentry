package com.zentry.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AusenciaVistaDTO {

    private String id;
    private String empleadoId;
    private String empleado;
    private String departamento;
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