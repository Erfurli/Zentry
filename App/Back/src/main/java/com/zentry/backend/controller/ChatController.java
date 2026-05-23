package com.zentry.backend.controller;

import com.zentry.backend.dto.*;
import com.zentry.backend.entity.Mensaje;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.MensajeRepository;
import com.zentry.backend.repository.UsuarioRepository;
import com.zentry.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final UsuarioRepository usuarioRepository;
    private final EmpleadoRepository empleadoRepository;
    private final MensajeRepository mensajeRepository;

    /**
     * Resuelve el ID interno del usuario basándose en su Principal de Spring Security.
     * 
     * @param principal identidad del usuario conectado
     * @return identificador único del usuario
     */
    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByUsername(principal.getName())
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @GetMapping("/api/chat/usuarios")
    public List<UsuarioResumenDTO> getUsuariosParaChat(Authentication authentication) {
        String usernameActual = authentication.getName();

        return usuarioRepository.findAll().stream()
                .filter(u -> !u.getUsername().equals(usernameActual))
                .map(u -> {
                    String nombre = u.getUsername();
                    String rol = u.getRolSistema() != null ? u.getRolSistema().name() : "";
                    String foto = null;

                    if (u.getEmpleadoId() != null) {
                        var empOpt = empleadoRepository.findById(u.getEmpleadoId());
                        if (empOpt.isPresent()) {
                            var emp = empOpt.get();
                            nombre = emp.getNombre();
                            rol = emp.getRolEmpresa() != null ? emp.getRolEmpresa().name() : rol;
                            foto = emp.getFoto();
                        }
                    }

                    return new UsuarioResumenDTO(
                            u.getId(),
                            nombre,
                            iniciales(nombre),
                            rol,
                            foto
                    );
                })
                .toList();
    }

    /**
     * Obtiene las iniciales de un nombre completo.
     * 
     * @param nombre nombre a procesar
     * @return string de dos caracteres en mayúsculas
     */
    private String iniciales(String nombre) {
        String[] partes = nombre.trim().split(" ");
        if (partes.length >= 2)
            return (partes[0].substring(0, 1) + partes[1].substring(0, 1)).toUpperCase();
        return nombre.substring(0, Math.min(2, nombre.length())).toUpperCase();
    }

    /**
     * Obtiene todas las conversaciones activas del usuario solicitante.
     * 
     * @param principal identidad del usuario conectado
     * @return ResponseEntity con la lista de DTOs de conversaciones
     */
    @GetMapping("/api/chat/conversaciones")
    public ResponseEntity<List<ConversacionDTO>> getConversaciones(Principal principal) {
        return ResponseEntity.ok(chatService.getConversacionesDeUsuario(getUsuarioId(principal)));
    }

    /**
     * Obtiene el historial de mensajes no eliminados de una conversación específica.
     * 
     * @param id identificador de la conversación
     * @return ResponseEntity con la lista de DTOs de mensajes
     */
    @GetMapping("/api/chat/conversaciones/{id}/mensajes")
    public ResponseEntity<List<MensajeDTO>> getMensajes(@PathVariable String id) {
        return ResponseEntity.ok(chatService.getMensajes(id));
    }

    /**
     * Crea un nuevo canal de conversación de grupo.
     * 
     * @param req objeto con el nombre del grupo y lista de IDs de participantes
     * @param principal identidad del creador del grupo
     * @return ResponseEntity con la conversación de grupo creada
     */
    @PostMapping("/api/chat/grupos")
    public ResponseEntity<ConversacionDTO> crearGrupo(
            @RequestBody CrearGrupoRequest req, Principal principal) {
        return ResponseEntity.ok(
                chatService.crearGrupo(req.getNombre(), req.getParticipanteIds(), getUsuarioId(principal))
        );
    }

    /**
     * Abre o recupera una conversación individual entre el usuario logueado y otro participante.
     * 
     * @param usuarioBId identificador del otro usuario participante
     * @param principal identidad del usuario logueado
     * @return ResponseEntity con los detalles de la conversación individual
     */
    @PostMapping("/api/chat/individual/{usuarioBId}")
    public ResponseEntity<ConversacionDTO> abrirIndividual(
            @PathVariable String usuarioBId, Principal principal) {
        return ResponseEntity.ok(
                chatService.abrirConversacionIndividual(getUsuarioId(principal), usuarioBId)
        );
    }

    /**
     * Endpoint WebSocket de STOMP para el envío y redistribución de mensajes en tiempo real.
     * 
     * @param req los datos del mensaje a enviar (conversacionId, contenido, respuestaAId)
     * @param principal identidad del autor
     */
    @MessageMapping("/chat.enviar")
    public void enviarMensaje(EnviarMensajeRequest req, Principal principal) {
        chatService.enviarMensaje(req, getUsuarioId(principal));
    }

    /**
     * Endpoint WebSocket de STOMP para añadir o retirar reacciones a un mensaje.
     * 
     * @param req los datos de la reacción (mensajeId, emoji)
     * @param principal identidad del usuario que reacciona
     */
    @MessageMapping("/chat.reaccion")
    public void toggleReaccion(ReaccionRequest req, Principal principal) {
        chatService.toggleReaccion(req, getUsuarioId(principal));
    }

    @MessageMapping("/chat.editar")
    public void editarMensaje(@Payload Map<String, String> payload, Principal principal) {
        String mensajeId = payload.get("mensajeId");
        String contenido = payload.get("contenido");
        String uid = getUsuarioId(principal);

        mensajeRepository.findById(mensajeId).ifPresent(m -> {
            if (!m.getAutorId().equals(uid)) return;
            m.setContenido(contenido);
            m.setEditadoEn(LocalDateTime.now());
            Mensaje guardado = mensajeRepository.save(m);
            MensajeDTO dto = chatService.toMensajeDTOPublico(guardado);
            //messagingTemplate.convertAndSend("/topic/conversacion/" + m.getConversacionId(), dto);
        });
    }

    @MessageMapping("/chat.fijar")
    public void fijarMensaje(@Payload Map<String, String> payload, Principal principal) {
        String mensajeId = payload.get("mensajeId");
        mensajeRepository.findById(mensajeId).ifPresent(m -> {
            m.setFijado(!m.isFijado());
            Mensaje guardado = mensajeRepository.save(m);
            MensajeDTO dto = chatService.toMensajeDTOPublico(guardado);
            //messagingTemplate.convertAndSend("/topic/conversacion/" + m.getConversacionId(), dto);
        });
    }

    @GetMapping("/api/chat/conversaciones/{id}/fijados")
    public ResponseEntity<List<MensajeDTO>> getFijados(@PathVariable String id) {
        return ResponseEntity.ok(chatService.getMensajesFijados(id));
    }
}