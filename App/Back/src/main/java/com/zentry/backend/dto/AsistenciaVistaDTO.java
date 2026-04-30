package com.zentry.backend.dto;

public class AsistenciaVistaDTO {

    private Long empleadoId;
    private String nombre;
    private String departamento;
    private String estado;
    private String entrada;
    private String salida;
    private String fecha;

    public AsistenciaVistaDTO() {}

    public AsistenciaVistaDTO(Long empleadoId, String nombre, String departamento,
                              String estado, String entrada, String salida, String fecha) {
        this.empleadoId = empleadoId;
        this.nombre = nombre;
        this.departamento = departamento;
        this.estado = estado;
        this.entrada = entrada;
        this.salida = salida;
        this.fecha = fecha;
    }

    public Long getEmpleadoId() { return empleadoId; }
    public void setEmpleadoId(Long empleadoId) { this.empleadoId = empleadoId; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDepartamento() { return departamento; }
    public void setDepartamento(String departamento) { this.departamento = departamento; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getEntrada() { return entrada; }
    public void setEntrada(String entrada) { this.entrada = entrada; }
    public String getSalida() { return salida; }
    public void setSalida(String salida) { this.salida = salida; }
    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }
}


