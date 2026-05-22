package com.zentry.backend.controller;

import com.zentry.backend.model.SugerenciaVacaciones;
import com.zentry.backend.model.Vacaciones;
import com.zentry.backend.repository.SugerenciaRepository;
import com.zentry.backend.repository.VacacionesRepository;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.UsuarioRepository;
import com.zentry.backend.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sugerencias")
@RequiredArgsConstructor
public class SugerenciaController {

    private final SugerenciaRepository sugerenciaRepository;
    private final VacacionesRepository vacacionesRepository;
    private final EmpleadoRepository empleadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;

    @GetMapping("/empleado/{empleadoId}")
    public List<SugerenciaVacaciones> getByEmpleado(@PathVariable String empleadoId) {
        return sugerenciaRepository.findByEmpleadoId(empleadoId);
    }

    @GetMapping("/empleado/{empleadoId}/pendientes")
    public List<SugerenciaVacaciones> getPendientesByEmpleado(@PathVariable String empleadoId) {
        return sugerenciaRepository.findByEmpleadoIdAndEstado(empleadoId, "Pendiente");
    }

    @PostMapping
    public ResponseEntity<SugerenciaVacaciones> crear(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        String vacacionesId     = body.get("vacacionesId");
        String nuevaFechaInicio = body.get("nuevaFechaInicio");
        String nuevaFechaFin    = body.get("nuevaFechaFin");
        String mensajeSugerencia = body.getOrDefault("mensaje",
                "Se ha sugerido un cambio de fechas para tus vacaciones.");

        Vacaciones vacaciones = vacacionesRepository.findById(vacacionesId)
                .orElseThrow(() -> new RuntimeException("Vacaciones no encontradas"));

        long dias = ChronoUnit.DAYS.between(
                LocalDate.parse(nuevaFechaInicio),
                LocalDate.parse(nuevaFechaFin)
        ) + 1;

        SugerenciaVacaciones sugerencia = SugerenciaVacaciones.builder()
                .vacacionesId(vacacionesId)
                .empleadoId(vacaciones.getEmpleadoId())
                .creadoPor(authentication.getName())
                .nuevaFechaInicio(nuevaFechaInicio)
                .nuevaFechaFin(nuevaFechaFin)
                .nuevosDias((int) dias)
                .estado("Pendiente")
                .fechaCreacion(LocalDate.now().toString())
                .mensaje(mensajeSugerencia)
                .build();

        SugerenciaVacaciones guardada = sugerenciaRepository.save(sugerencia);

        usuarioRepository.findAll().stream()
                .filter(u -> vacaciones.getEmpleadoId().equals(u.getEmpleadoId()))
                .findFirst()
                .ifPresent(u -> notificacionService.crear(
                        u.getId(),
                        "Sugerencia de cambio de vacaciones",
                        "Se han sugerido nuevas fechas para tus vacaciones: "
                                + nuevaFechaInicio + " al " + nuevaFechaFin
                                + ". " + mensajeSugerencia,
                        "vacaciones",
                        "/vacaciones"
                ));

        return ResponseEntity.ok(guardada);
    }

    @PatchMapping("/{id}/aceptar")
    public ResponseEntity<SugerenciaVacaciones> aceptar(@PathVariable String id) {
        return sugerenciaRepository.findById(id)
                .map(s -> {
                    vacacionesRepository.findById(s.getVacacionesId()).ifPresent(v -> {
                        v.setFechaInicio(s.getNuevaFechaInicio());
                        v.setFechaFin(s.getNuevaFechaFin());
                        v.setDias(s.getNuevosDias());
                        vacacionesRepository.save(v);
                    });
                    s.setEstado("Aceptada");
                    return ResponseEntity.ok(sugerenciaRepository.save(s));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/rechazar")
    public ResponseEntity<SugerenciaVacaciones> rechazar(@PathVariable String id) {
        return sugerenciaRepository.findById(id)
                .map(s -> {
                    s.setEstado("Rechazada");
                    return ResponseEntity.ok(sugerenciaRepository.save(s));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}