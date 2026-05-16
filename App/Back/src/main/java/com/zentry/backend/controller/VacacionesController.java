package com.zentry.backend.controller;

import com.zentry.backend.dto.VacacionesVistaDTO;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.model.Vacaciones;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.UsuarioRepository;
import com.zentry.backend.repository.VacacionesRepository;
import com.zentry.backend.service.EmailService;
import com.zentry.backend.service.NotificacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vacaciones")
public class VacacionesController {

    private final VacacionesRepository vacacionesRepository;
    private final EmpleadoRepository empleadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;
    private final NotificacionService notificacionService;

    public VacacionesController(VacacionesRepository vacacionesRepository,
                                EmpleadoRepository empleadoRepository,
                                UsuarioRepository usuarioRepository,
                                EmailService emailService,
                                NotificacionService notificacionService) {
        this.vacacionesRepository = vacacionesRepository;
        this.empleadoRepository = empleadoRepository;
        this.usuarioRepository = usuarioRepository;
        this.emailService = emailService;
        this.notificacionService = notificacionService;
    }

    @GetMapping
    public List<Vacaciones> getAll() {
        return vacacionesRepository.findAll();
    }

    @GetMapping("/vista")
    public List<VacacionesVistaDTO> getVista(@RequestParam(required = false) String estado,
                                             @RequestParam(required = false) Integer year) {
        return vacacionesRepository.findAll().stream()
                .filter(v -> {
                    // Excluir vacaciones de empleados dados de baja
                    return empleadoRepository.findById(v.getEmpleadoId())
                            .map(emp -> Boolean.TRUE.equals(emp.getActivo()))
                            .orElse(false);
                })
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
    public ResponseEntity<Vacaciones> solicitar(@RequestBody Map<String, String> body,
                                                Authentication authentication) {
        String username = authentication.getName();

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Empleado empleado = empleadoRepository.findById(usuario.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

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

        vacacionesRepository.save(vacacion);

        notificacionService.notificarAdmins(
                "Nueva solicitud de vacaciones",
                empleado.getNombre() + " ha solicitado vacaciones del " + fechaInicio + " al " + fechaFin,
                "vacaciones",
                "/vacaciones"
        );

        return ResponseEntity.ok(vacacion);
    }

    @PatchMapping("/{id}/aprobar")
    public Vacaciones aprobar(@PathVariable String id, Authentication authentication) {
        Vacaciones vacacion = vacacionesRepository.findById(id).orElseThrow();
        vacacion.setEstado("Aprobada");
        Vacaciones guardada = vacacionesRepository.save(vacacion);

        Empleado emp = empleadoRepository.findById(vacacion.getEmpleadoId()).orElse(null);
        if (emp != null) {
            emailService.enviarCambioEstadoVacaciones(emp.getEmail(), emp.getNombre(), "Aprobada");

            usuarioRepository.findAll().stream()
                    .filter(u -> emp.getId().equals(u.getEmpleadoId()))
                    .findFirst()
                    .ifPresent(u -> notificacionService.crear(
                            u.getId(),
                            "Vacaciones aprobadas",
                            "Tu solicitud de vacaciones del " + vacacion.getFechaInicio()
                                    + " al " + vacacion.getFechaFin() + " ha sido aprobada por "
                                    + authentication.getName(),
                            "vacaciones",
                            "/vacaciones"
                    ));

            notificacionService.notificarAdmins(
                    "Vacaciones aprobadas",
                    authentication.getName() + " ha aprobado las vacaciones de " + emp.getNombre(),
                    "vacaciones",
                    "/vacaciones"
            );
        }

        return guardada;
    }

    @PatchMapping("/{id}/rechazar")
    public Vacaciones rechazar(@PathVariable String id, Authentication authentication) {
        Vacaciones vacacion = vacacionesRepository.findById(id).orElseThrow();
        vacacion.setEstado("Rechazada");
        Vacaciones guardada = vacacionesRepository.save(vacacion);

        Empleado emp = empleadoRepository.findById(vacacion.getEmpleadoId()).orElse(null);
        if (emp != null) {
            emailService.enviarCambioEstadoVacaciones(emp.getEmail(), emp.getNombre(), "Rechazada");

            usuarioRepository.findAll().stream()
                    .filter(u -> emp.getId().equals(u.getEmpleadoId()))
                    .findFirst()
                    .ifPresent(u -> notificacionService.crear(
                            u.getId(),
                            "Vacaciones rechazadas",
                            "Tu solicitud de vacaciones del " + vacacion.getFechaInicio()
                                    + " al " + vacacion.getFechaFin() + " ha sido rechazada por "
                                    + authentication.getName(),
                            "vacaciones",
                            "/vacaciones"
                    ));

            notificacionService.notificarAdmins(
                    "Vacaciones rechazadas",
                    authentication.getName() + " ha rechazado las vacaciones de " + emp.getNombre(),
                    "vacaciones",
                    "/vacaciones"
            );
        }

        return guardada;
    }

    @GetMapping("/pendientes/count")
    public ResponseEntity<Map<String, Long>> countPendientes() {
        long count = vacacionesRepository.findAll().stream()
                .filter(v -> "Pendiente".equalsIgnoreCase(v.getEstado()))
                .count();
        return ResponseEntity.ok(Map.of("count", count));
    }

}