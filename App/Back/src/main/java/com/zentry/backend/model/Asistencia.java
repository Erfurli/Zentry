package com.zentry.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "attendance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asistencia {

    @Id
    private String id;

    private String empleadoId;
    private String fecha;

    private String entrada;
    private String salida;

    private String inicioDescanso;
    private String finDescanso;

    private String estado;

    private Double horasTotales;
    private Double horasExtra;

    private String modo;


    private String incidenciaTipo;
    private String incidenciaDescripcion;
    private String incidenciaEstado; // <--- pendiente, resuelta, o rechazada
    private String incidenciaFechaReporte;
}