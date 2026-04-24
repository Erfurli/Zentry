package com.zentry.backend.controller;

import com.zentry.backend.model.Empleado;
import com.zentry.backend.repository.EmpleadoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/empleados")
@RequiredArgsConstructor
public class EmpleadoController {

    private final EmpleadoRepository empleadoRepository;

    @GetMapping
    public List<Empleado> getAll() {
        return empleadoRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Empleado> getById(@PathVariable Long id) {
        return empleadoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/activos")
    public List<Empleado> getActivos() {
        return empleadoRepository.findByActivo(true);
    }

    @GetMapping("/departamento/{departamento}")
    public List<Empleado> getByDepartamento(@PathVariable String departamento) {
        return empleadoRepository.findByDepartamento(departamento);
    }

    @PostMapping
    public Empleado crear(@RequestBody Empleado empleado) {
        if (empleado.getId() == null) {
            Long siguienteId = empleadoRepository.findTopByOrderByIdDesc()
                    .map(e -> e.getId() + 1)
                    .orElse(1L);

            empleado.setId(siguienteId);
        }

        return empleadoRepository.save(empleado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Empleado> actualizar(@PathVariable Long id, @RequestBody Empleado empleadoActualizado) {
        return empleadoRepository.findById(id)
                .map(empleado -> {
                    empleado.setNombre(empleadoActualizado.getNombre());
                    empleado.setEmail(empleadoActualizado.getEmail());
                    empleado.setDni(empleadoActualizado.getDni());
                    empleado.setDepartamento(empleadoActualizado.getDepartamento());
                    empleado.setPuesto(empleadoActualizado.getPuesto());
                    empleado.setFechaAlta(empleadoActualizado.getFechaAlta());
                    empleado.setActivo(empleadoActualizado.getActivo());
                    empleado.setRol(empleadoActualizado.getRol());
                    return ResponseEntity.ok(empleadoRepository.save(empleado));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-activo")
    public ResponseEntity<Empleado> toggleActivo(@PathVariable Long id) {
        return empleadoRepository.findById(id)
                .map(empleado -> {
                    empleado.setActivo(!Boolean.TRUE.equals(empleado.getActivo()));
                    return ResponseEntity.ok(empleadoRepository.save(empleado));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!empleadoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        empleadoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}