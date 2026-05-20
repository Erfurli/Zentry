package com.zentry.backend.controller;

import com.zentry.backend.model.Empleado;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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

    /**
     * Obtiene un empleado específico por su ID.
     * 
     * @param id identificador del empleado
     * @return ResponseEntity con el empleado o NOT FOUND si no existe
     */
    @GetMapping("/{id}")
    public ResponseEntity<Empleado> getById(@PathVariable String id) {
        return empleadoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/activos")
    public List<Empleado> getActivos() {
        return empleadoRepository.findByActivo(true);
    }

    /**
     * Filtra empleados pertenecientes a un determinado departamento.
     * 
     * @param departamento nombre del departamento
     * @return lista de empleados del departamento
     */
    @GetMapping("/departamento/{departamento}")
    public List<Empleado> getByDepartamento(@PathVariable String departamento) {
        return empleadoRepository.findByDepartamento(departamento);
    }

    /**
     * Guarda un nuevo empleado en la base de datos.
     * 
     * @param empleado entidad a registrar
     * @return el empleado guardado con su ID generado
     */
    @PostMapping
    public Empleado crear(@RequestBody Empleado empleado) {
        empleado.setId(null);
        return empleadoRepository.save(empleado);
    }

    /**
     * Actualiza los datos de un empleado existente.
     * 
     * @param id identificador del empleado a actualizar
     * @param empleadoActualizado objeto con las modificaciones correspondientes
     * @return ResponseEntity con el empleado modificado
     */
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

    /**
     * Invierte el estado activo/inactivo de un empleado.
     * 
     * @param id identificador del empleado
     * @return ResponseEntity con el empleado guardado
     */
    @PatchMapping("/{id}/toggle-activo")
    public ResponseEntity<Empleado> toggleActivo(@PathVariable String id) {
        return empleadoRepository.findById(id)
                .map(empleado -> {
                    empleado.setActivo(!Boolean.TRUE.equals(empleado.getActivo()));
                    return ResponseEntity.ok(empleadoRepository.save(empleado));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Actualiza la foto de perfil de un empleado específico.
     * 
     * @param id identificador del empleado
     * @param body mapa que contiene la clave "foto" con el string en Base64 o URL
     * @return ResponseEntity con estado OK o NOT FOUND si el empleado no existe
     */
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

    /**
     * Elimina físicamente un empleado del sistema.
     * 
     * @param id identificador del empleado a borrar
     * @return ResponseEntity sin contenido o NOT FOUND si no se encuentra
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        if (!empleadoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        empleadoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Recupera los empleados activos que todavía no disponen de una cuenta de usuario vinculada.
     * 
     * @return lista de empleados sin usuario
     */
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