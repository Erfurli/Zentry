package com.zentry.backend.controller;

import com.zentry.backend.dto.ReporteResumenDTO;
import com.zentry.backend.model.Asistencia;
import com.zentry.backend.model.Ausencia;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.Vacaciones;
import com.zentry.backend.repository.AsistenciaRepository;
import com.zentry.backend.repository.AusenciaRepository;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.VacacionesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReportesController {

    private final EmpleadoRepository empleadoRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final VacacionesRepository vacacionesRepository;
    private final AusenciaRepository ausenciaRepository;


    @GetMapping
    public List<ReporteResumenDTO> getReportes(
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        List<ReporteResumenDTO> reportes = new ArrayList<>();
        String fechaGeneracion = LocalDate.now().toString();
        String periodo = construirPeriodo(year, month);

        if (tipo == null || tipo.equalsIgnoreCase("Asistencia")) {
            long total = asistenciaRepository.findAll().stream()
                    .filter(a -> year == null || matchYear(a.getFecha(), year))
                    .filter(a -> month == null || matchMonth(a.getFecha(), month))
                    .count();
            reportes.add(new ReporteResumenDTO(
                    "Asistencia " + periodo, "Asistencia", "Todos",
                    fechaGeneracion, periodo, total, "Generado"));
        }

        if (tipo == null || tipo.equalsIgnoreCase("Vacaciones")) {
            long total = vacacionesRepository.findAll().stream()
                    .filter(v -> year == null || matchYear(v.getFechaInicio(), year))
                    .count();
            reportes.add(new ReporteResumenDTO(
                    "Vacaciones " + (year != null ? year : "Histórico"), "Vacaciones", "Todos",
                    fechaGeneracion, year != null ? String.valueOf(year) : "Histórico", total, "Generado"));
        }

        if (tipo == null || tipo.equalsIgnoreCase("Ausencias")) {
            long total = ausenciaRepository.findAll().stream()
                    .filter(a -> year == null || matchYear(a.getFechaInicio(), year))
                    .count();
            reportes.add(new ReporteResumenDTO(
                    "Ausencias " + periodo, "Ausencias", "Todos",
                    fechaGeneracion, periodo, total, "Generado"));
        }

        if (tipo == null || tipo.equalsIgnoreCase("Empleados")) {
            long total = empleadoRepository.findAll().stream()
                    .filter(Empleado::getActivo).count();
            reportes.add(new ReporteResumenDTO(
                    "Empleados activos", "Empleados", "Todos",
                    fechaGeneracion, "Actual", total, "Generado"));
        }

        return reportes;
    }


    @GetMapping("/datos/asistencia")
    public List<Map<String, Object>> getDatosAsistencia(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String departamento) {

        List<Empleado> empleados = empleadoRepository.findAll();

        return asistenciaRepository.findAll().stream()
                .filter(a -> year == null || matchYear(a.getFecha(), year))
                .filter(a -> month == null || matchMonth(a.getFecha(), month))
                .map(a -> {
                    String nombreEmp = empleados.stream()
                            .filter(e -> e.getId().equals(a.getEmpleadoId()))
                            .map(Empleado::getNombre)
                            .findFirst().orElse("Desconocido");
                    String deptEmp = empleados.stream()
                            .filter(e -> e.getId().equals(a.getEmpleadoId()))
                            .map(Empleado::getDepartamento)
                            .findFirst().orElse("-");

                    if (departamento != null && !departamento.equals("Todos")
                            && !deptEmp.equals(departamento)) return null;

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("nombre",         nombreEmp);
                    row.put("departamento",   deptEmp);
                    row.put("fecha",          a.getFecha());
                    row.put("entrada",        a.getEntrada());
                    row.put("inicioDescanso", a.getInicioDescanso());
                    row.put("finDescanso",    a.getFinDescanso());
                    row.put("salida",         a.getSalida());
                    row.put("horasTotales",   a.getHorasTotales());
                    row.put("horasExtra",     a.getHorasExtra());
                    row.put("estado",         a.getEstado());
                    row.put("modo",           a.getModo());
                    return row;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }


    @GetMapping("/datos/vacaciones")
    public List<Map<String, Object>> getDatosVacaciones(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String departamento) {

        List<Empleado> empleados = empleadoRepository.findAll();

        return vacacionesRepository.findAll().stream()
                .filter(v -> year == null || matchYear(v.getFechaInicio(), year))
                .filter(v -> estado == null || estado.equals("Todos") || v.getEstado().equalsIgnoreCase(estado))
                .map(v -> {
                    String nombreEmp = empleados.stream()
                            .filter(e -> e.getId().equals(v.getEmpleadoId()))
                            .map(Empleado::getNombre)
                            .findFirst().orElse("Desconocido");
                    String deptEmp = empleados.stream()
                            .filter(e -> e.getId().equals(v.getEmpleadoId()))
                            .map(Empleado::getDepartamento)
                            .findFirst().orElse("-");

                    if (departamento != null && !departamento.equals("Todos")
                            && !deptEmp.equals(departamento)) return null;

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("empleado",     nombreEmp);
                    row.put("departamento", deptEmp);
                    row.put("fechaInicio",  v.getFechaInicio());
                    row.put("fechaFin",     v.getFechaFin());
                    row.put("dias",         v.getDias());
                    row.put("estado",       v.getEstado());
                    return row;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }


    @GetMapping("/datos/ausencias")
    public List<Map<String, Object>> getDatosAusencias(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String departamento) {

        List<Empleado> empleados = empleadoRepository.findAll();

        return ausenciaRepository.findAll().stream()
                .filter(a -> year == null || matchYear(a.getFechaInicio(), year))
                .filter(a -> estado == null || estado.equals("Todos") || a.getEstado().equalsIgnoreCase(estado))
                .map(a -> {
                    String nombreEmp = empleados.stream()
                            .filter(e -> e.getId().equals(a.getEmpleadoId()))
                            .map(Empleado::getNombre)
                            .findFirst().orElse("Desconocido");
                    String deptEmp = empleados.stream()
                            .filter(e -> e.getId().equals(a.getEmpleadoId()))
                            .map(Empleado::getDepartamento)
                            .findFirst().orElse("-");

                    if (departamento != null && !departamento.equals("Todos")
                            && !deptEmp.equals(departamento)) return null;

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("empleado",        nombreEmp);
                    row.put("departamento",    deptEmp);
                    row.put("fechaInicio",     a.getFechaInicio());
                    row.put("fechaFin",        a.getFechaFin());
                    row.put("dias",            a.getDias());
                    row.put("tipo",            a.getTipo());
                    row.put("estado",          a.getEstado());
                    row.put("motivo",          a.getMotivo());
                    return row;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }


    @GetMapping("/resumen-general")
    public Map<String, Object> getResumenGeneral() {
        long empleadosActivos   = empleadoRepository.findAll().stream().filter(Empleado::getActivo).count();
        long empleadosInactivos = empleadoRepository.findAll().stream().filter(e -> !e.getActivo()).count();
        long vacPendientes      = vacacionesRepository.findAll().stream().filter(v -> "Pendiente".equalsIgnoreCase(v.getEstado())).count();
        long vacAprobadas       = vacacionesRepository.findAll().stream().filter(v -> "Aprobada".equalsIgnoreCase(v.getEstado())).count();
        long ausencias          = ausenciaRepository.count();
        long registrosAsistencia= asistenciaRepository.count();
        long retrasos           = asistenciaRepository.findAll().stream()
                .filter(a -> a.getEntrada() != null && a.getEntrada().compareTo("09:15") > 0).count();

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("empleadosActivos",    empleadosActivos);
        res.put("empleadosInactivos",  empleadosInactivos);
        res.put("vacacionesPendientes",vacPendientes);
        res.put("vacacionesAprobadas", vacAprobadas);
        res.put("ausencias",           ausencias);
        res.put("registrosAsistencia", registrosAsistencia);
        res.put("retrasos",            retrasos);
        return res;
    }


    private boolean matchYear(String fecha, Integer year) {
        return fecha != null && fecha.startsWith(String.valueOf(year));
    }

    private boolean matchMonth(String fecha, Integer month) {
        if (fecha == null || fecha.length() < 7) return false;
        return fecha.substring(5, 7).equals(String.format("%02d", month));
    }

    private String construirPeriodo(Integer year, Integer month) {
        if (year != null && month != null) return year + "-" + String.format("%02d", month);
        if (year != null) return String.valueOf(year);
        return "Histórico";
    }
}