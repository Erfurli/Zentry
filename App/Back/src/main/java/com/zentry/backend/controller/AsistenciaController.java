package com.zentry.backend.controller;

import com.zentry.backend.model.Asistencia;
import com.zentry.backend.repository.AsistenciaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/asistencia")
@RequiredArgsConstructor
public class AsistenciaController {

    private final AsistenciaRepository asistenciaRepository;

    @GetMapping
    public List<Asistencia> getAll() {
        return asistenciaRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Asistencia> getById(@PathVariable Long id) {
        return asistenciaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/empleado/{empleadoId}")
    public List<Asistencia> getByEmpleadoId(@PathVariable Long empleadoId) {
        return asistenciaRepository.findByEmpleadoId(empleadoId);
    }

    @GetMapping("/fecha/{fecha}")
    public List<Asistencia> getByFecha(@PathVariable String fecha) {
        return asistenciaRepository.findByFecha(fecha);
    }

    @PostMapping
    public Asistencia crear(@RequestBody Asistencia asistencia) {
        return asistenciaRepository.save(asistencia);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Asistencia> actualizar(@PathVariable Long id, @RequestBody Asistencia actualizada) {
        return asistenciaRepository.findById(id)
                .map(asistencia -> {
                    asistencia.setEmpleadoId(actualizada.getEmpleadoId());
                    asistencia.setFecha(actualizada.getFecha());
                    asistencia.setEntrada(actualizada.getEntrada());
                    asistencia.setSalida(actualizada.getSalida());
                    asistencia.setHoras(actualizada.getHoras());
                    asistencia.setModo(actualizada.getModo());
                    return ResponseEntity.ok(asistenciaRepository.save(asistencia));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!asistenciaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        asistenciaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}