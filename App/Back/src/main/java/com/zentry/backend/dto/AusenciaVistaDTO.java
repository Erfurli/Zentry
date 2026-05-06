package com.zentry.backend.dto;

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

    public AusenciaVistaDTO() {}

    public AusenciaVistaDTO(String id, String empleadoId, String empleado, String departamento,
                            String fechaInicio, String fechaFin, Integer dias,
                            String tipo, String estado, String motivo, String fechaSolicitud) {
        this.id = id;
        this.empleadoId = empleadoId;
        this.empleado = empleado;
        this.departamento = departamento;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.dias = dias;
        this.tipo = tipo;
        this.estado = estado;
        this.motivo = motivo;
        this.fechaSolicitud = fechaSolicitud;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmpleadoId() { return empleadoId; }
    public void setEmpleadoId(String empleadoId) { this.empleadoId = empleadoId; }

    public String getEmpleado() { return empleado; }
    public void setEmpleado(String empleado) { this.empleado = empleado; }

    public String getDepartamento() { return departamento; }
    public void setDepartamento(String departamento) { this.departamento = departamento; }

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
