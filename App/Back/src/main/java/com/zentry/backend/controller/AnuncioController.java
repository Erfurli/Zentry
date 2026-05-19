package com.zentry.backend.controller;

import com.zentry.backend.model.Anuncio;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.repository.AnuncioRepository;
import com.zentry.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/anuncios")
@RequiredArgsConstructor
public class AnuncioController {

    private final AnuncioRepository anuncioRepository;
    private final UsuarioRepository usuarioRepository;

    // ── Obtener todos los anuncios activos (todos los empleados) ──────────────
    @GetMapping
    public ResponseEntity<List<Anuncio>> getAnuncios() {
        LocalDateTime ahora = LocalDateTime.now();
        List<Anuncio> todos = anuncioRepository.findByActivoTrueOrderByDestacadoDescFechaCreacionDesc();
        // Filtrar los expirados
        List<Anuncio> vigentes = todos.stream()
                .filter(a -> a.getFechaExpiracion() == null || a.getFechaExpiracion().isAfter(ahora))
                .toList();
        return ResponseEntity.ok(vigentes);
    }

    // ── Obtener TODOS (incluyendo inactivos) — solo ADMIN ────────────────────
    @GetMapping("/admin/todos")
    public ResponseEntity<List<Anuncio>> getTodosAdmin(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(anuncioRepository.findAll());
    }

    // ── Crear anuncio — solo ADMIN ────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<Anuncio> crearAnuncio(@RequestBody Anuncio anuncio, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        Usuario autor = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        anuncio.setId(null);
        anuncio.setAutorId(autor.getId());
        anuncio.setFechaCreacion(LocalDateTime.now());
        anuncio.setActivo(true);
        anuncio.setVistoPor(new ArrayList<>());

        return ResponseEntity.status(HttpStatus.CREATED).body(anuncioRepository.save(anuncio));
    }

    // ── Editar anuncio — solo ADMIN ───────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<Anuncio> editarAnuncio(@PathVariable String id,
                                                 @RequestBody Anuncio cambios,
                                                 Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        return anuncioRepository.findById(id).map(existente -> {
            existente.setTitulo(cambios.getTitulo());
            existente.setContenido(cambios.getContenido());
            existente.setCategoria(cambios.getCategoria());
            existente.setFechaExpiracion(cambios.getFechaExpiracion());
            existente.setDestacado(cambios.isDestacado());
            return ResponseEntity.ok(anuncioRepository.save(existente));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Activar / desactivar (archivar) — solo ADMIN ─────────────────────────
    @PatchMapping("/{id}/estado")
    public ResponseEntity<Anuncio> cambiarEstado(@PathVariable String id,
                                                 @RequestBody Map<String, Boolean> body,
                                                 Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        return anuncioRepository.findById(id).map(a -> {
            a.setActivo(Boolean.TRUE.equals(body.get("activo")));
            return ResponseEntity.ok(anuncioRepository.save(a));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Eliminar — solo ADMIN ─────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarAnuncio(@PathVariable String id, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        anuncioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Marcar como visto (empleado) ──────────────────────────────────────────
    @PostMapping("/{id}/visto")
    public ResponseEntity<Void> marcarVisto(@PathVariable String id, Authentication auth) {
        Usuario usuario = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        anuncioRepository.findById(id).ifPresent(a -> {
            if (a.getVistoPor() == null) a.setVistoPor(new ArrayList<>());
            if (!a.getVistoPor().contains(usuario.getId())) {
                a.getVistoPor().add(usuario.getId());
                anuncioRepository.save(a);
            }
        });
        return ResponseEntity.ok().build();
    }

    // ── Helper: comprobar rol ADMIN ───────────────────────────────────────────
    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("ROLE_ADMIN"));
    }
}