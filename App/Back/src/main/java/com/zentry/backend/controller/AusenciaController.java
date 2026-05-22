package com.zentry.backend.controller;

import com.zentry.backend.dto.AusenciaVistaDTO;
import com.zentry.backend.model.Ausencia;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.repository.AusenciaRepository;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.UsuarioRepository;
import com.zentry.backend.service.NotificacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ausencias")
public class AusenciaController {

    private final AusenciaRepository ausenciaRepository;
    private final EmpleadoRepository empleadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;

    public AusenciaController(AusenciaRepository ausenciaRepository,
                              EmpleadoRepository empleadoRepository,
                              UsuarioRepository usuarioRepository,
                              NotificacionService notificacionService) {
        this.ausenciaRepository = ausenciaRepository;
        this.empleadoRepository = empleadoRepository;
        this.usuarioRepository = usuarioRepository;
        this.notificacionService = notificacionService;
    }

    @GetMapping("/vista")
    public List<AusenciaVistaDTO> getVista(
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String estado) {

        return ausenciaRepository.findAll().stream()
                .filter(a -> empleadoRepository.findById(a.getEmpleadoId())
                        .map(emp -> Boolean.TRUE.equals(emp.getActivo()))
                        .orElse(false))
                .filter(a -> tipo == null || tipo.equalsIgnoreCase(a.getTipo()))
                .filter(a -> estado == null || estado.equalsIgnoreCase(a.getEstado()))
                .map(this::toDTO)
                .toList();
    }

    @GetMapping("/mis-ausencias")
    public ResponseEntity<List<AusenciaVistaDTO>> getMisAusencias(Authentication authentication) {
        Usuario usuario = usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<AusenciaVistaDTO> misAusencias = ausenciaRepository
                .findByEmpleadoId(usuario.getEmpleadoId())
                .stream()
                .map(this::toDTO)
                .toList();

        return ResponseEntity.ok(misAusencias);
    }

    @PostMapping("/solicitar")
    public ResponseEntity<Ausencia> solicitar(@RequestBody Map<String, String> body,
                                              Authentication authentication) {
        Usuario usuario = usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Empleado empleado = empleadoRepository.findById(usuario.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        String fechaInicio = body.get("fechaInicio");
        String fechaFin    = body.get("fechaFin");
        String tipo        = body.getOrDefault("tipo", "Asunto Personal");
        String motivo      = body.getOrDefault("motivo", "");

        long dias = ChronoUnit.DAYS.between(
                LocalDate.parse(fechaInicio),
                LocalDate.parse(fechaFin)
        ) + 1;

        Ausencia ausencia = Ausencia.builder()
                .empleadoId(usuario.getEmpleadoId())
                .fechaInicio(fechaInicio)
                .fechaFin(fechaFin)
                .dias((int) dias)
                .tipo(tipo)
                .estado("Pendiente")
                .motivo(motivo)
                .fechaSolicitud(LocalDate.now().toString())
                .build();

        ausenciaRepository.save(ausencia);

        notificacionService.notificarAdmins(
                "Nueva solicitud de ausencia",
                empleado.getNombre() + " ha solicitado una ausencia por \"" + tipo
                        + "\" del " + fechaInicio + " al " + fechaFin,
                "ausencias",
                "/ausencias"
        );

        return ResponseEntity.ok(ausencia);
    }

    @PatchMapping("/{id}/justificar")
    public ResponseEntity<Ausencia> justificar(@PathVariable String id,
                                               Authentication authentication) {
        Ausencia ausencia = ausenciaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ausencia no encontrada"));

        ausencia.setEstado("Justificada");
        Ausencia guardada = ausenciaRepository.save(ausencia);

        notificarEmpleado(ausencia.getEmpleadoId(),
                "Ausencia justificada",
                "Tu ausencia del " + ausencia.getFechaInicio()
                        + " al " + ausencia.getFechaFin()
                        + " ha sido justificada por " + authentication.getName());

        return ResponseEntity.ok(guardada);
    }

    @PatchMapping("/{id}/no-justificar")
    public ResponseEntity<Ausencia> noJustificar(@PathVariable String id,
                                                 Authentication authentication) {
        Ausencia ausencia = ausenciaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ausencia no encontrada"));

        ausencia.setEstado("No Justificada");
        Ausencia guardada = ausenciaRepository.save(ausencia);

        notificarEmpleado(ausencia.getEmpleadoId(),
                "Ausencia no justificada",
                "Tu ausencia del " + ausencia.getFechaInicio()
                        + " al " + ausencia.getFechaFin()
                        + " ha sido marcada como no justificada por " + authentication.getName());

        return ResponseEntity.ok(guardada);
    }

    private AusenciaVistaDTO toDTO(Ausencia a) {
        Empleado emp = empleadoRepository.findById(a.getEmpleadoId()).orElse(null);
        return new AusenciaVistaDTO(
                a.getId(),
                a.getEmpleadoId(),
                emp != null ? emp.getNombre()       : "Empleado desconocido",
                emp != null ? emp.getDepartamento() : "-",
                a.getFechaInicio(),
                a.getFechaFin(),
                a.getDias(),
                a.getTipo(),
                a.getEstado(),
                a.getMotivo(),
                a.getFechaSolicitud()
        );
    }

    private void notificarEmpleado(String empleadoId, String titulo, String mensaje) {
        usuarioRepository.findAll().stream()
                .filter(u -> empleadoId.equals(u.getEmpleadoId()))
                .findFirst()
                .ifPresent(u -> notificacionService.crear(
                        u.getId(), titulo, mensaje, "ausencias", "/ausencias"
                ));
    }

    @GetMapping("/pendientes/count")
    public ResponseEntity<Map<String, Long>> countPendientes() {
        long count = ausenciaRepository.findAll().stream()
                .filter(a -> "Pendiente".equalsIgnoreCase(a.getEstado()))
                .count();
        return ResponseEntity.ok(Map.of("count", count));
    }
}