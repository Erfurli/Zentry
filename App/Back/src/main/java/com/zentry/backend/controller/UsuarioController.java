package com.zentry.backend.controller;

import com.zentry.backend.model.Usuario;
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

    @GetMapping("/username/{username}")
    public ResponseEntity<Usuario> getByUsername(@PathVariable String username) {
        return usuarioRepository.findByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Usuario crear(@RequestBody Usuario usuario) {
        usuario.setId(null);
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        return usuarioRepository.save(usuario);
    }

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

    @PatchMapping("/{id}/toggle-activo")
    public ResponseEntity<Usuario> toggleActivo(@PathVariable String id) {
        return usuarioRepository.findById(id)
                .map(usuario -> {
                    usuario.setActivo(!Boolean.TRUE.equals(usuario.getActivo()));
                    return ResponseEntity.ok(usuarioRepository.save(usuario));
                })
                .orElse(ResponseEntity.notFound().build());
    }

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
}