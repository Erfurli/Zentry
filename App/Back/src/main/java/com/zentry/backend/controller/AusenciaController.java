package com.zentry.backend.controller;

import com.zentry.backend.dto.AusenciaVistaDTO;
import com.zentry.backend.model.Ausencia;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.RolEmpresa;
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
            @RequestParam(required = false) String estado,
            Authentication authentication) {

        Usuario usuarioActual = usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado"));

        Empleado empleadoActual = empleadoRepository.findById(usuarioActual.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado asociado no encontrado"));

        boolean esAdmin = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("ROLE_ADMIN"));

        boolean esMando = empleadoActual.getRolEmpresa() == RolEmpresa.MANDO;

        return ausenciaRepository.findAll().stream()
                .filter(a -> {
                    Empleado emp = empleadoRepository.findById(a.getEmpleadoId()).orElse(null);
                    if (emp == null || !Boolean.TRUE.equals(emp.getActivo())) return false;

                    if (esMando && !esAdmin) {
                        return emp.getDepartamento() != null &&
                                emp.getDepartamento().equalsIgnoreCase(empleadoActual.getDepartamento());
                    }

                    return true;
                })
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
                .justificanteBase64(body.getOrDefault("justificanteBase64", null))
                .justificanteNombre(body.getOrDefault("justificanteNombre", null))
                .justificanteTipo(body.getOrDefault("justificanteTipo", null))
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
        return AusenciaVistaDTO.builder()
                .id(a.getId())
                .empleadoId(a.getEmpleadoId())
                .empleado(emp != null ? emp.getNombre() : "Empleado desconocido")
                .departamento(emp != null ? emp.getDepartamento() : "-")
                .fechaInicio(a.getFechaInicio())
                .fechaFin(a.getFechaFin())
                .dias(a.getDias())
                .tipo(a.getTipo())
                .estado(a.getEstado())
                .motivo(a.getMotivo())
                .fechaSolicitud(a.getFechaSolicitud())
                .justificanteBase64(a.getJustificanteBase64())
                .justificanteNombre(a.getJustificanteNombre())
                .justificanteTipo(a.getJustificanteTipo())
                .build();
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

    @PatchMapping("/{id}/justificante")
    public ResponseEntity<Ausencia> subirJustificante(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        Usuario usuario = usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return ausenciaRepository.findById(id).map(a -> {
            boolean esAdmin = authentication.getAuthorities().stream()
                    .anyMatch(r -> r.getAuthority().equals("ROLE_ADMIN"));
            if (!esAdmin && !a.getEmpleadoId().equals(usuario.getEmpleadoId())) {
                return ResponseEntity.status(403).<Ausencia>build();
            }

            a.setJustificanteBase64(body.get("base64"));
            a.setJustificanteNombre(body.get("nombre"));
            a.setJustificanteTipo(body.get("tipo"));
            return ResponseEntity.ok(ausenciaRepository.save(a));
        }).orElse(ResponseEntity.notFound().build());
    }
}