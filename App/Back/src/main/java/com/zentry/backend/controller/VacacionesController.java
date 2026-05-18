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
    public ResponseEntity<?> solicitar(@RequestBody Map<String, String> body,
                                       Authentication authentication) {
        String username = authentication.getName();

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Empleado empleado = empleadoRepository.findById(usuario.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        String fechaInicio = body.get("fechaInicio");
        String fechaFin    = body.get("fechaFin");

        java.time.LocalDate inicio = java.time.LocalDate.parse(fechaInicio);
        java.time.LocalDate fin    = java.time.LocalDate.parse(fechaFin);

        if (fin.isBefore(inicio)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "La fecha de fin no puede ser anterior a la de inicio"));
        }

        long diasSolicitados = java.time.temporal.ChronoUnit.DAYS.between(inicio, fin) + 1;

        int anioActual = java.time.LocalDate.now().getYear();
        int diasUsados = vacacionesRepository.findAll().stream()
                .filter(v -> v.getEmpleadoId().equals(empleado.getId()))
                .filter(v -> "Aprobada".equals(v.getEstado()) || "Pendiente".equals(v.getEstado()))
                .filter(v -> v.getFechaInicio() != null
                        && v.getFechaInicio().startsWith(String.valueOf(anioActual)))
                .mapToInt(v -> v.getDias() != null ? v.getDias() : 0)
                .sum();

        int saldoTotal = empleado.getDiasVacaciones() != null ? empleado.getDiasVacaciones() : 22;
        int saldoDisponible = saldoTotal - diasUsados;

        if (diasSolicitados > saldoDisponible) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Saldo insuficiente",
                    "saldoDisponible", saldoDisponible,
                    "diasSolicitados", diasSolicitados
            ));
        }

        boolean solapa = vacacionesRepository.findAll().stream()
                .filter(v -> v.getEmpleadoId().equals(empleado.getId()))
                .filter(v -> "Aprobada".equals(v.getEstado()))
                .anyMatch(v -> {
                    java.time.LocalDate vInicio = java.time.LocalDate.parse(v.getFechaInicio());
                    java.time.LocalDate vFin    = java.time.LocalDate.parse(v.getFechaFin());
                    return !fin.isBefore(vInicio) && !inicio.isAfter(vFin);
                });

        if (solapa) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Las fechas se solapan con vacaciones ya aprobadas"
            ));
        }

        Vacaciones vacacion = Vacaciones.builder()
                .empleadoId(usuario.getEmpleadoId())
                .fechaInicio(fechaInicio)
                .fechaFin(fechaFin)
                .dias((int) diasSolicitados)
                .estado("Pendiente")
                .build();

        vacacionesRepository.save(vacacion);

        notificacionService.notificarAdmins(
                "Nueva solicitud de vacaciones",
                empleado.getNombre() + " ha solicitado vacaciones del "
                        + fechaInicio + " al " + fechaFin
                        + " (" + diasSolicitados + " días, saldo restante: "
                        + (saldoDisponible - diasSolicitados) + ")",
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

    @GetMapping("/saldo")
    public ResponseEntity<Map<String, Integer>> getSaldo(Authentication authentication) {
        Usuario usuario = usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow();
        Empleado empleado = empleadoRepository.findById(usuario.getEmpleadoId())
                .orElseThrow();

        int anioActual = java.time.LocalDate.now().getYear();
        int diasUsados = vacacionesRepository.findAll().stream()
                .filter(v -> v.getEmpleadoId().equals(empleado.getId()))
                .filter(v -> "Aprobada".equals(v.getEstado()) || "Pendiente".equals(v.getEstado()))
                .filter(v -> v.getFechaInicio() != null
                        && v.getFechaInicio().startsWith(String.valueOf(anioActual)))
                .mapToInt(v -> v.getDias() != null ? v.getDias() : 0)
                .sum();

        int saldoTotal     = empleado.getDiasVacaciones() != null ? empleado.getDiasVacaciones() : 22;
        int saldoDisponible = saldoTotal - diasUsados;

        return ResponseEntity.ok(Map.of(
                "total",      saldoTotal,
                "usados",     diasUsados,
                "disponible", saldoDisponible
        ));
    }

}