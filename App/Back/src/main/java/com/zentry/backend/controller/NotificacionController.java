package com.zentry.backend.controller;

import com.zentry.backend.entity.PreferenciaNotificacion;
import com.zentry.backend.model.Notificacion;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.repository.PreferenciaNotificacionRepository;
import com.zentry.backend.repository.UsuarioRepository;
import com.zentry.backend.service.NotificacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
@CrossOrigin(origins = "http://localhost:4200")
public class NotificacionController {

    private final NotificacionService notificacionService;
    private final UsuarioRepository usuarioRepository;
    private final PreferenciaNotificacionRepository preferenciasRepository;

    public NotificacionController(NotificacionService notificacionService,
                                  UsuarioRepository usuarioRepository, PreferenciaNotificacionRepository preferenciasRepository) {
        this.notificacionService = notificacionService;
        this.usuarioRepository = usuarioRepository;
        this.preferenciasRepository = preferenciasRepository;
    }

    @GetMapping
    public ResponseEntity<List<Notificacion>> getMisNotificaciones(Authentication authentication) {
        Usuario usuario = usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return ResponseEntity.ok(notificacionService.getParaUsuario(usuario.getId()));
    }

    @PatchMapping("/{id}/leer")
    public ResponseEntity<?> marcarLeida(@PathVariable String id) {
        notificacionService.marcarLeida(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PatchMapping("/leer-todas")
    public ResponseEntity<?> marcarTodasLeidas(Authentication authentication) {
        Usuario usuario = usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        notificacionService.marcarTodasLeidas(usuario.getId());
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/preferencias")
    public ResponseEntity<Map<String, PreferenciaNotificacion.TipoPreferencia>> getPreferencias(Principal principal) {
        String uid = usuarioRepository.findByUsername(principal.getName())
                .map(u -> u.getId()).orElseThrow();
        return preferenciasRepository.findByUsuarioId(uid)
                .map(p -> ResponseEntity.ok(p.getPreferencias()))
                .orElse(ResponseEntity.ok(Map.of()));
    }

    @PutMapping("/preferencias")
    public ResponseEntity<Void> putPreferencias(
            @RequestBody Map<String, PreferenciaNotificacion.TipoPreferencia> body,
            Principal principal) {
        String uid = usuarioRepository.findByUsername(principal.getName())
                .map(u -> u.getId()).orElseThrow();
        PreferenciaNotificacion pref = preferenciasRepository.findByUsuarioId(uid)
                .orElse(PreferenciaNotificacion.builder().usuarioId(uid).build());
        pref.setPreferencias(body);
        preferenciasRepository.save(pref);
        return ResponseEntity.ok().build();
    }

}