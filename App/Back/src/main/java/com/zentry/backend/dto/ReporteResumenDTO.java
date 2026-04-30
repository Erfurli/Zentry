package com.zentry.backend.dto;

public class ReporteResumenDTO {
    private String nombre;
    private String tipo;
    private String departamento;
    private String fechaGeneracion;
    private String periodo;
    private Long registros;
    private String estado;

    public ReporteResumenDTO() {}

    public ReporteResumenDTO(String nombre, String tipo, String departamento,
                             String fechaGeneracion, String periodo,
                             Long registros, String estado) {
        this.nombre = nombre;
        this.tipo = tipo;
        this.departamento = departamento;
        this.fechaGeneracion = fechaGeneracion;
        this.periodo = periodo;
        this.registros = registros;
        this.estado = estado;
    }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getDepartamento() { return departamento; }
    public void setDepartamento(String departamento) { this.departamento = departamento; }
    public String getFechaGeneracion() { return fechaGeneracion; }
    public void setFechaGeneracion(String fechaGeneracion) { this.fechaGeneracion = fechaGeneracion; }
    public String getPeriodo() { return periodo; }
    public void setPeriodo(String periodo) { this.periodo = periodo; }
    public Long getRegistros() { return registros; }
    public void setRegistros(Long registros) { this.registros = registros; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
