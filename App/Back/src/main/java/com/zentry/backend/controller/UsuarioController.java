package com.zentry.backend.controller;

import com.zentry.backend.model.Usuario;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final EmpleadoRepository empleadoRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public List<Usuario> getAll() {
        return usuarioRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> getById(@PathVariable String id) {
        return usuarioRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Busca un usuario registrado por su nombre de usuario único.
     * 
     * @param username string identificativo del username
     * @return ResponseEntity conteniendo el usuario o NOT FOUND si no se encuentra
     */
    @GetMapping("/username/{username}")
    public ResponseEntity<Usuario> getByUsername(@PathVariable String username) {
        return usuarioRepository.findByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Crea un usuario codificando previamente su contraseña encriptada.
     * 
     * @param usuario entidad con el username y password plano a registrar
     * @return el usuario persistido con contraseña encriptada
     */
    @PostMapping
    public Usuario crear(@RequestBody Usuario usuario) {
        usuario.setId(null);
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        return usuarioRepository.save(usuario);
    }

    /**
     * Actualiza propiedades generales de la cuenta de usuario.
     * 
     * @param id identificador del usuario
     * @param actualizado entidad con los campos de reemplazo
     * @return ResponseEntity con el usuario guardado
     */
    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizar(@PathVariable String id, @RequestBody Usuario actualizado) {
        return usuarioRepository.findById(id)
                .map(usuario -> {
                    usuario.setEmpleadoId(actualizado.getEmpleadoId());
                    usuario.setUsername(actualizado.getUsername());
                    usuario.setRolSistema(actualizado.getRolSistema());
                    usuario.setActivo(actualizado.getActivo());
                    return ResponseEntity.ok(usuarioRepository.save(usuario));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Alterna la activación del usuario y sincroniza de forma automatizada el estado de su ficha de empleado vinculada.
     * 
     * @param id identificador del usuario
     * @return ResponseEntity con el usuario modificado
     */
    @PatchMapping("/{id}/toggle-activo")
    public ResponseEntity<Usuario> toggleActivo(@PathVariable String id) {
        return usuarioRepository.findById(id)
                .map(usuario -> {
                    boolean nuevoEstado = !Boolean.TRUE.equals(usuario.getActivo());
                    usuario.setActivo(nuevoEstado);
                    usuarioRepository.save(usuario);

                    if (usuario.getEmpleadoId() != null) {
                        empleadoRepository.findById(usuario.getEmpleadoId()).ifPresent(empleado -> {
                            empleado.setActivo(nuevoEstado);
                            empleadoRepository.save(empleado);
                        });
                    }

                    return ResponseEntity.ok(usuario);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Resetea administrativamente la contraseña obligando al usuario a cambiarla en su próximo acceso.
     * 
     * @param id identificador del usuario
     * @param body mapa que contiene opcionalmente el valor de "password" por defecto (si se omite se usa el propio username)
     * @return ResponseEntity de éxito de la operación
     */
    @PatchMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(@PathVariable String id, @RequestBody Map<String, String> body) {
        return usuarioRepository.findById(id)
                .map(usuario -> {
                    String nuevaPassword = body.getOrDefault("password", usuario.getUsername());
                    usuario.setPassword(passwordEncoder.encode(nuevaPassword));
                    usuario.setMustChangePassword(true);
                    usuarioRepository.save(usuario);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Cambia la contraseña definitiva del usuario retirando la obligatoriedad de cambio de contraseña.
     * 
     * @param id identificador del usuario
     * @param body mapa conteniendo la clave "password" con el nuevo string
     * @return ResponseEntity de éxito
     */
    @PatchMapping("/{id}/cambiar-password")
    public ResponseEntity<Void> cambiarPassword(@PathVariable String id, @RequestBody Map<String, String> body) {
        return usuarioRepository.findById(id)
                .map(usuario -> {
                    usuario.setPassword(passwordEncoder.encode(body.get("password")));
                    usuario.setMustChangePassword(false);
                    usuarioRepository.save(usuario);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        usuarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/usuarios/por-empleado/{empleadoId}")
    public ResponseEntity<Map<String, String>> getUsuarioPorEmpleado(@PathVariable String empleadoId) {
        return usuarioRepository.findAll().stream()
                .filter(u -> empleadoId.equals(u.getEmpleadoId()))
                .findFirst()
                .map(u -> ResponseEntity.ok(Map.of("id", u.getId(), "username", u.getUsername())))
                .orElse(ResponseEntity.notFound().build());
    }

}