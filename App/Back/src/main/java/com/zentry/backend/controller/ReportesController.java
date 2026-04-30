package com.zentry.backend.controller;

import com.zentry.backend.dto.ReporteResumenDTO;
import com.zentry.backend.model.Asistencia;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.Vacaciones;
import com.zentry.backend.repository.AsistenciaRepository;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.VacacionesRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/reportes")
public class ReportesController {

    private final EmpleadoRepository empleadoRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final VacacionesRepository vacacionesRepository;

    public ReportesController(EmpleadoRepository empleadoRepository,
                              AsistenciaRepository asistenciaRepository,
                              VacacionesRepository vacacionesRepository) {
        this.empleadoRepository = empleadoRepository;
        this.asistenciaRepository = asistenciaRepository;
        this.vacacionesRepository = vacacionesRepository;
    }

    @GetMapping
    public List<ReporteResumenDTO> getReportes(@RequestParam(required = false) String tipo,
                                               @RequestParam(required = false) Integer year,
                                               @RequestParam(required = false) Integer month) {
        List<ReporteResumenDTO> reportes = new ArrayList<>();
        String fechaGeneracion = LocalDate.now().toString();

        if (tipo == null || tipo.equalsIgnoreCase("Asistencia")) {
            long totalAsistencia = asistenciaRepository.findAll().stream()
                    .filter(a -> year == null || (a.getFecha() != null && a.getFecha().startsWith(String.valueOf(year))))
                    .filter(a -> month == null || matchMonth(a.getFecha(), month))
                    .count();

            reportes.add(new ReporteResumenDTO(
                    "Asistencia " + construirPeriodo(year, month),
                    "Asistencia",
                    "Todos",
                    fechaGeneracion,
                    construirPeriodo(year, month),
                    totalAsistencia,
                    "Generado"
            ));
        }

        if (tipo == null || tipo.equalsIgnoreCase("Vacaciones")) {
            long totalVacaciones = vacacionesRepository.findAll().stream()
                    .filter(v -> year == null || (v.getFechaInicio() != null && v.getFechaInicio().startsWith(String.valueOf(year))))
                    .count();

            reportes.add(new ReporteResumenDTO(
                    "Vacaciones " + (year != null ? year : "Histórico"),
                    "Vacaciones",
                    "Todos",
                    fechaGeneracion,
                    year != null ? String.valueOf(year) : "Histórico",
                    totalVacaciones,
                    "Generado"
            ));
        }

        if (tipo == null || tipo.equalsIgnoreCase("Empleados")) {
            long totalEmpleados = empleadoRepository.findAll().stream()
                    .filter(Empleado::getActivo)
                    .count();

            reportes.add(new ReporteResumenDTO(
                    "Empleados activos",
                    "Empleados",
                    "Todos",
                    fechaGeneracion,
                    "Actual",
                    totalEmpleados,
                    "Generado"
            ));
        }

        return reportes;
    }

    @GetMapping("/resumen-general")
    public ResumenGeneralDto getResumenGeneral() {
        long empleadosActivos = empleadoRepository.findAll().stream().filter(Empleado::getActivo).count();
        long empleadosInactivos = empleadoRepository.findAll().stream().filter(e -> !e.getActivo()).count();
        long vacacionesPendientes = vacacionesRepository.findAll().stream().filter(v -> "Pendiente".equalsIgnoreCase(v.getEstado())).count();
        long vacacionesAprobadas = vacacionesRepository.findAll().stream().filter(v -> "Aprobada".equalsIgnoreCase(v.getEstado())).count();
        long registrosAsistencia = asistenciaRepository.count();
        long retrasos = asistenciaRepository.findAll().stream()
                .filter(a -> a.getEntrada() != null && a.getEntrada().compareTo("09:15") > 0)
                .count();
        long ausencias = empleadoRepository.count() - asistenciaRepository.count();

        return new ResumenGeneralDto(
                empleadosActivos,
                empleadosInactivos,
                vacacionesPendientes,
                vacacionesAprobadas,
                registrosAsistencia,
                retrasos,
                ausencias
        );
    }

    private boolean matchMonth(String fecha, Integer month) {
        if (fecha == null || fecha.length() < 7) return false;
        String mes = fecha.substring(5, 7);
        return mes.equals(String.format("%02d", month));
    }

    private String construirPeriodo(Integer year, Integer month) {
        if (year != null && month != null) return year + "-" + String.format("%02d", month);
        if (year != null) return String.valueOf(year);
        return "Histórico";
    }

    public static class ResumenGeneralDto {
        private long empleadosActivos;
        private long empleadosInactivos;
        private long vacacionesPendientes;
        private long vacacionesAprobadas;
        private long registrosAsistencia;
        private long retrasos;
        private long ausencias;

        public ResumenGeneralDto(long empleadosActivos, long empleadosInactivos, long vacacionesPendientes,
                                 long vacacionesAprobadas, long registrosAsistencia, long retrasos,
                                 long ausencias) {
            this.empleadosActivos = empleadosActivos;
            this.empleadosInactivos = empleadosInactivos;
            this.vacacionesPendientes = vacacionesPendientes;
            this.vacacionesAprobadas = vacacionesAprobadas;
            this.registrosAsistencia = registrosAsistencia;
            this.retrasos = retrasos;
            this.ausencias = ausencias;
        }

        public long getEmpleadosActivos() { return empleadosActivos; }
        public long getEmpleadosInactivos() { return empleadosInactivos; }
        public long getVacacionesPendientes() { return vacacionesPendientes; }
        public long getVacacionesAprobadas() { return vacacionesAprobadas; }
        public long getRegistrosAsistencia() { return registrosAsistencia; }
        public long getRetrasos() { return retrasos; }
        public long getAusencias() { return ausencias; }
    }
}