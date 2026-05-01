package com.zentry.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder


@Document("vacations")
public class Vacaciones {

    @Id
    private String id;

    private String empleadoId;
    private String fechaInicio;
    private String fechaFin;
    private Integer dias;
    private String estado;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmpleadoId() { return empleadoId; }
    public void setEmpleadoId(String empleadoId) { this.empleadoId = empleadoId; }

    public String getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(String fechaInicio) { this.fechaInicio = fechaInicio; }

    public String getFechaFin() { return fechaFin; }
    public void setFechaFin(String fechaFin) { this.fechaFin = fechaFin; }

    public Integer getDias() { return dias; }
    public void setDias(Integer dias) { this.dias = dias; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}