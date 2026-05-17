package com.zentry.backend.dto;

public class AsistenciaVistaDTO {

    private String id;
    private String empleadoId;
    private String nombre;
    private String departamento;
    private String estado;
    private String entrada;
    private String salida;
    private String inicioDescanso;
    private String finDescanso;
    private Double horasTotales;
    private Double horasExtra;
    private String fecha;

    private String incidenciaTipo;
    private String incidenciaDescripcion;
    private String incidenciaEstado;

    public String getIncidenciaTipo() {
        return incidenciaTipo;
    }

    public void setIncidenciaTipo(String incidenciaTipo) {
        this.incidenciaTipo = incidenciaTipo;
    }

    public String getIncidenciaDescripcion() {
        return incidenciaDescripcion;
    }

    public void setIncidenciaDescripcion(String incidenciaDescripcion) {
        this.incidenciaDescripcion = incidenciaDescripcion;
    }

    public String getIncidenciaEstado() {
        return incidenciaEstado;
    }

    public void setIncidenciaEstado(String incidenciaEstado) {
        this.incidenciaEstado = incidenciaEstado;
    }

    public String getIncidenciaFechaReporte() {
        return incidenciaFechaReporte;
    }

    public void setIncidenciaFechaReporte(String incidenciaFechaReporte) {
        this.incidenciaFechaReporte = incidenciaFechaReporte;
    }

    private String incidenciaFechaReporte;


    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getInicioDescanso() {
        return inicioDescanso;
    }

    public void setInicioDescanso(String inicioDescanso) {
        this.inicioDescanso = inicioDescanso;
    }

    public String getFinDescanso() {
        return finDescanso;
    }

    public void setFinDescanso(String finDescanso) {
        this.finDescanso = finDescanso;
    }

    public Double getHorasTotales() {
        return horasTotales;
    }

    public void setHorasTotales(Double horasTotales) {
        this.horasTotales = horasTotales;
    }

    public Double getHorasExtra() {
        return horasExtra;
    }

    public void setHorasExtra(Double horasExtra) {
        this.horasExtra = horasExtra;
    }
    public String getEmpleadoId() { return empleadoId; }
    public void setEmpleadoId(String empleadoId) { this.empleadoId = empleadoId; }
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


    public AsistenciaVistaDTO() {}

    public AsistenciaVistaDTO(String empleadoId, String nombre, String departamento,
                              String estado, String entrada, String salida, String fecha) {
        this.empleadoId = empleadoId;
        this.nombre = nombre;
        this.departamento = departamento;
        this.estado = estado;
        this.entrada = entrada;
        this.salida = salida;
        this.fecha = fecha;
    }

    public AsistenciaVistaDTO(String id, String empleadoId, String nombre, String departamento,
                              String estado, String entrada, String salida,
                              String inicioDescanso, String finDescanso,
                              Double horasTotales, Double horasExtra, String fecha) {
        this.id = id;
        this.empleadoId = empleadoId;
        this.nombre = nombre;
        this.departamento = departamento;
        this.estado = estado;
        this.entrada = entrada;
        this.salida = salida;
        this.inicioDescanso = inicioDescanso;
        this.finDescanso = finDescanso;
        this.horasTotales = horasTotales;
        this.horasExtra = horasExtra;
        this.fecha = fecha;
    }


}