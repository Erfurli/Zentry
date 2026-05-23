package com.zentry.backend.controller;

import com.zentry.backend.model.Empleado;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.zentry.backend.model.Usuario;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/empleados")
@RequiredArgsConstructor
public class EmpleadoController {

    private final EmpleadoRepository empleadoRepository;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public List<Empleado> getAll() {
        return empleadoRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANDO') or #id == principal.empleadoId")
    public ResponseEntity<Empleado> getById(@PathVariable String id) {
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
        empleado.setId(null);
        return empleadoRepository.save(empleado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Empleado> actualizar(@PathVariable String id, @RequestBody Empleado empleadoActualizado) {
        return empleadoRepository.findById(id)
                .map(empleado -> {
                    empleado.setNombre(empleadoActualizado.getNombre());
                    empleado.setEmail(empleadoActualizado.getEmail());
                    empleado.setDni(empleadoActualizado.getDni());
                    empleado.setDepartamento(empleadoActualizado.getDepartamento());
                    empleado.setPuesto(empleadoActualizado.getPuesto());
                    empleado.setFechaAlta(empleadoActualizado.getFechaAlta());
                    empleado.setActivo(empleadoActualizado.getActivo());
                    empleado.setRolEmpresa(empleadoActualizado.getRolEmpresa());
                    return ResponseEntity.ok(empleadoRepository.save(empleado));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-activo")
    public ResponseEntity<Empleado> toggleActivo(@PathVariable String id) {
        return empleadoRepository.findById(id)
                .map(empleado -> {
                    empleado.setActivo(!Boolean.TRUE.equals(empleado.getActivo()));
                    return ResponseEntity.ok(empleadoRepository.save(empleado));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/foto")
    public ResponseEntity<Void> actualizarFoto(@PathVariable String id, @RequestBody Map<String, String> body) {
        return empleadoRepository.findById(id)
                .map(emp -> {
                    emp.setFoto(body.get("foto"));
                    empleadoRepository.save(emp);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        if (!empleadoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        empleadoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/sin-usuario")
    public List<Empleado> getSinUsuario() {
        List<String> empleadoIdsConUsuario = usuarioRepository.findAll()
                .stream()
                .map(Usuario::getEmpleadoId)
                .toList();

        return empleadoRepository.findByActivo(true)
                .stream()
                .filter(e -> !empleadoIdsConUsuario.contains(e.getId()))
                .toList();
    }
}