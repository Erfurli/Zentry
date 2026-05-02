package com.zentry.backend.controller;

import com.zentry.backend.dto.VacacionesVistaDTO;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.Vacaciones;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.VacacionesRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vacaciones")
public class VacacionesController {

    private final VacacionesRepository vacacionesRepository;
    private final EmpleadoRepository empleadoRepository;
    private final com.zentry.backend.repository.UsuarioRepository usuarioRepository;

    public VacacionesController(VacacionesRepository vacacionesRepository,
                                EmpleadoRepository empleadoRepository,
                                com.zentry.backend.repository.UsuarioRepository usuarioRepository) {
        this.vacacionesRepository = vacacionesRepository;
        this.empleadoRepository = empleadoRepository;
        this.usuarioRepository = usuarioRepository;
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
                .filter(v -> year == null || (v.getFechaInicio() != null
                        && v.getFechaInicio().startsWith(String.valueOf(year))))
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
                            "Vacaciones anuales"
                    );
                })
                .toList();
    }

    @PostMapping("/solicitar")
    public ResponseEntity<Vacaciones> solicitar(@RequestBody java.util.Map<String, String> body,
                                                org.springframework.security.core.Authentication authentication) {
        String username = authentication.getName();

        com.zentry.backend.model.Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String fechaInicio = body.get("fechaInicio");
        String fechaFin = body.get("fechaFin");

        long dias = java.time.temporal.ChronoUnit.DAYS.between(
                java.time.LocalDate.parse(fechaInicio),
                java.time.LocalDate.parse(fechaFin)
        ) + 1;

        Vacaciones vacacion = Vacaciones.builder()
                .empleadoId(usuario.getEmpleadoId())
                .fechaInicio(fechaInicio)
                .fechaFin(fechaFin)
                .dias((int) dias)
                .estado("Pendiente")
                .build();

        return ResponseEntity.ok(vacacionesRepository.save(vacacion));
    }

    @PatchMapping("/{id}/aprobar")
    public Vacaciones aprobar(@PathVariable String id) {
        Vacaciones vacacion = vacacionesRepository.findById(id).orElseThrow();
        vacacion.setEstado("Aprobada");
        return vacacionesRepository.save(vacacion);
    }

    @PatchMapping("/{id}/rechazar")
    public Vacaciones rechazar(@PathVariable String id) {
        Vacaciones vacacion = vacacionesRepository.findById(id).orElseThrow();
        vacacion.setEstado("Rechazada");
        return vacacionesRepository.save(vacacion);
    }
}