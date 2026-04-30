package com.zentry.backend.controller;

import com.zentry.backend.dto.VacacionesVistaDTO;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.Vacaciones;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.VacacionesRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vacaciones")
public class VacacionesController {

    private final VacacionesRepository vacacionesRepository;
    private final EmpleadoRepository empleadoRepository;

    public VacacionesController(VacacionesRepository vacacionesRepository,
                                EmpleadoRepository empleadoRepository) {
        this.vacacionesRepository = vacacionesRepository;
        this.empleadoRepository = empleadoRepository;
    }

    @GetMapping
    public List<Vacaciones> getAll() {
        return vacacionesRepository.findAll();
    }

    @GetMapping("/vista")
    public List<VacacionesVistaDTO> getVista(@RequestParam(required = false) String estado,
                                             @RequestParam(required = false) Integer year) {
        return vacacionesRepository.findAll().stream()
                .filter(v -> estado == null || estado.equalsIgnoreCase(v.getEstado()))
                .filter(v -> year == null || (v.getFechaInicio() != null && v.getFechaInicio().startsWith(String.valueOf(year))))
                .map(v -> {
                    Empleado emp = empleadoRepository.findById(v.getEmpleadoId()).orElse(null);
                    return new VacacionesVistaDTO(
                            v.getId(),
                            v.getEmpleadoId(),
                            emp != null ? emp.getNombre() : "Empleado desconocido",
                            emp != null ? emp.getDepartamento() : "-",
                            v.getFechaInicio(),
                            v.getFechaFin(),
                            v.getDias(),
                            v.getEstado(),
                            v.getMotivo() != null ? v.getMotivo() : "Vacaciones anuales"
                    );
                })
                .collect(Collectors.toList());
    }

    @PatchMapping("/{id}/aprobar")
    public Vacaciones aprobar(@PathVariable Long id) {
        Vacaciones vacacion = vacacionesRepository.findById(id).orElseThrow();
        vacacion.setEstado("Aprobada");
        return vacacionesRepository.save(vacacion);
    }

    @PatchMapping("/{id}/rechazar")
    public Vacaciones rechazar(@PathVariable Long id) {
        Vacaciones vacacion = vacacionesRepository.findById(id).orElseThrow();
        vacacion.setEstado("Rechazada");
        return vacacionesRepository.save(vacacion);
    }
}