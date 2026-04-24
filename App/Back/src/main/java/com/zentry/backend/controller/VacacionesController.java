package com.zentry.backend.controller;

import com.zentry.backend.model.Vacaciones;
import com.zentry.backend.repository.VacacionesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vacaciones")
@RequiredArgsConstructor
public class VacacionesController {

    private final VacacionesRepository vacacionesRepository;

    @GetMapping
    public List<Vacaciones> getAll() {
        return vacacionesRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vacaciones> getById(@PathVariable Long id) {
        return vacacionesRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/empleado/{empleadoId}")
    public List<Vacaciones> getByEmpleadoId(@PathVariable Long empleadoId) {
        return vacacionesRepository.findByEmpleadoId(empleadoId);
    }

    @GetMapping("/estado/{estado}")
    public List<Vacaciones> getByEstado(@PathVariable String estado) {
        return vacacionesRepository.findByEstado(estado);
    }

    @PostMapping
    public Vacaciones crear(@RequestBody Vacaciones vacaciones) {
        return vacacionesRepository.save(vacaciones);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vacaciones> actualizar(@PathVariable Long id, @RequestBody Vacaciones actualizada) {
        return vacacionesRepository.findById(id)
                .map(vacaciones -> {
                    vacaciones.setEmpleadoId(actualizada.getEmpleadoId());
                    vacaciones.setFechaInicio(actualizada.getFechaInicio());
                    vacaciones.setFechaFin(actualizada.getFechaFin());
                    vacaciones.setDias(actualizada.getDias());
                    vacaciones.setEstado(actualizada.getEstado());
                    vacaciones.setFechaSolicitud(actualizada.getFechaSolicitud());
                    return ResponseEntity.ok(vacacionesRepository.save(vacaciones));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/aprobar")
    public ResponseEntity<Vacaciones> aprobar(@PathVariable Long id) {
        return vacacionesRepository.findById(id)
                .map(vacaciones -> {
                    vacaciones.setEstado("Aprobada");
                    return ResponseEntity.ok(vacacionesRepository.save(vacaciones));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/rechazar")
    public ResponseEntity<Vacaciones> rechazar(@PathVariable Long id) {
        return vacacionesRepository.findById(id)
                .map(vacaciones -> {
                    vacaciones.setEstado("Rechazada");
                    return ResponseEntity.ok(vacacionesRepository.save(vacaciones));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!vacacionesRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        vacacionesRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}