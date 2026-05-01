package com.zentry.backend.controller;

import com.zentry.backend.dto.AsistenciaVistaDTO;
import com.zentry.backend.model.Asistencia;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.repository.AsistenciaRepository;
import com.zentry.backend.repository.EmpleadoRepository;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/asistencia")
public class AsistenciaController {

    private final AsistenciaRepository asistenciaRepository;
    private final EmpleadoRepository empleadoRepository;

    public AsistenciaController(AsistenciaRepository asistenciaRepository,
                                EmpleadoRepository empleadoRepository) {
        this.asistenciaRepository = asistenciaRepository;
        this.empleadoRepository = empleadoRepository;
    }

    @GetMapping
    public List<Asistencia> getAll() {
        return asistenciaRepository.findAll();
    }

    @GetMapping("/vista")
    public List<AsistenciaVistaDTO> getVista(@RequestParam(required = false) String fecha) {
        List<Empleado> empleados = empleadoRepository.findAll();
        List<Asistencia> asistencias = fecha == null
                ? asistenciaRepository.findAll()
                : asistenciaRepository.findByFecha(fecha);

        List<AsistenciaVistaDTO> resultado = new ArrayList<>();

        for (Empleado emp : empleados) {
            Optional<Asistencia> asistenciaOpt = asistencias.stream()
                    .filter(a -> a.getEmpleadoId().equals(emp.getId()))
                    .findFirst();

            String entrada = "-";
            String salida = "-";
            String estado = "Ausente";
            String fechaFinal = fecha != null ? fecha : "";

            if (asistenciaOpt.isPresent()) {
                Asistencia asistencia = asistenciaOpt.get();
                entrada = asistencia.getEntrada() != null ? asistencia.getEntrada() : "-";
                salida = asistencia.getSalida() != null ? asistencia.getSalida() : "-";
                fechaFinal = asistencia.getFecha() != null ? asistencia.getFecha() : fechaFinal;

                if (asistencia.getEntrada() != null) {
                    estado = asistencia.getEntrada().compareTo("09:15") > 0 ? "Retraso" : "Presente";
                }
            }

            resultado.add(new AsistenciaVistaDTO(
                    emp.getId(),
                    emp.getNombre(),
                    emp.getDepartamento(),
                    estado,
                    entrada,
                    salida,
                    fechaFinal
            ));
        }

        return resultado;
    }
}