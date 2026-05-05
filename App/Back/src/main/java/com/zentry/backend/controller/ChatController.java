package com.zentry.backend.controller;

import com.zentry.backend.dto.*;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.UsuarioRepository;
import com.zentry.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final UsuarioRepository usuarioRepository;
    private final EmpleadoRepository empleadoRepository; // ← añadida instancia

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByUsername(principal.getName())
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @GetMapping("/api/chat/usuarios")
    public List<UsuarioResumenDTO> getUsuariosParaChat(Authentication authentication) {
        String usernameActual = authentication.getName();

        return empleadoRepository.findAll().stream() // ← instancia, no estático
                .filter(emp -> usuarioRepository.findAll().stream()
                        .filter(u -> u.getEmpleadoId().equals(emp.getId()))
                        .findFirst()
                        .map(u -> !u.getUsername().equals(usernameActual))
                        .orElse(false))
                .map(emp -> new UsuarioResumenDTO(
                        emp.getId(),
                        emp.getNombre(),
                        iniciales(emp.getNombre()),
                        emp.getRolEmpresa().name()
                ))
                .toList();
    }

    private String iniciales(String nombre) {
        String[] partes = nombre.trim().split(" ");
        if (partes.length >= 2)
            return (partes[0].substring(0, 1) + partes[1].substring(0, 1)).toUpperCase();
        return nombre.substring(0, Math.min(2, nombre.length())).toUpperCase();
    }

    @GetMapping("/api/chat/conversaciones")
    public ResponseEntity<List<ConversacionDTO>> getConversaciones(Principal principal) {
        return ResponseEntity.ok(chatService.getConversacionesDeUsuario(getUsuarioId(principal)));
    }

    @GetMapping("/api/chat/conversaciones/{id}/mensajes")
    public ResponseEntity<List<MensajeDTO>> getMensajes(@PathVariable String id) {
        return ResponseEntity.ok(chatService.getMensajes(id));
    }

    @PostMapping("/api/chat/grupos")
    public ResponseEntity<ConversacionDTO> crearGrupo(
            @RequestBody CrearGrupoRequest req, Principal principal) {
        return ResponseEntity.ok(
                chatService.crearGrupo(req.getNombre(), req.getParticipanteIds(), getUsuarioId(principal))
        );
    }

    @PostMapping("/api/chat/individual/{usuarioBId}")
    public ResponseEntity<ConversacionDTO> abrirIndividual(
            @PathVariable String usuarioBId, Principal principal) {
        return ResponseEntity.ok(
                chatService.abrirConversacionIndividual(getUsuarioId(principal), usuarioBId)
        );
    }

    @MessageMapping("/chat.enviar")
    public void enviarMensaje(EnviarMensajeRequest req, Principal principal) {
        chatService.enviarMensaje(req, getUsuarioId(principal));
    }

    @MessageMapping("/chat.reaccion")
    public void toggleReaccion(ReaccionRequest req, Principal principal) {
        chatService.toggleReaccion(req, getUsuarioId(principal));
    }
}