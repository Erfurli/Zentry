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
    private String tipo;       // Enfermedad | Asunto Personal | Médico | Familiar
    private String estado;     // Pendiente | Justificada | No Justificada
    private String motivo;
    private String fechaSolicitud;

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

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public String getFechaSolicitud() { return fechaSolicitud; }
    public void setFechaSolicitud(String fechaSolicitud) { this.fechaSolicitud = fechaSolicitud; }
}
