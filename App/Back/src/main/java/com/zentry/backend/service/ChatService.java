package com.zentry.backend.service;

import com.zentry.backend.dto.*;
import com.zentry.backend.entity.Conversacion;
import com.zentry.backend.entity.Mensaje;
import com.zentry.backend.entity.Reaccion;
import com.zentry.backend.entity.TipoConversacion;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import com.zentry.backend.service.NotificacionService;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConversacionRepository conversacionRepo;
    private final MensajeRepository mensajeRepo;
    private final ReaccionRepository reaccionRepo;
    private final UsuarioRepository usuarioRepo;
    private final EmpleadoRepository empleadoRepo;
    private final NotificacionService notificacionService;

    /**
     * Obtiene el histórico de conversaciones de las cuales es partícipe un usuario.
     * 
     * @param usuarioId identificador del usuario
     * @return lista de DTOs con la información consolidada de cada conversación
     */
    public List<ConversacionDTO> getConversacionesDeUsuario(String usuarioId) {
        return conversacionRepo.findByParticipantesContaining(usuarioId)
                .stream().map(c -> toConversacionDTO(c, usuarioId)).toList();
    }

    /**
     * Retorna los mensajes legibles ordenados cronológicamente de una conversación.
     * 
     * @param conversacionId identificador de la conversación
     * @return lista estructurada de mensajes en formato DTO
     */
    public List<MensajeDTO> getMensajes(String conversacionId) {
        return mensajeRepo.findByConversacionIdAndEliminadoFalseOrderByEnviadoEnAsc(conversacionId)
                .stream().map(this::toMensajeDTO).toList();
    }

    /**
     * Procesa, persiste y retransmite un nuevo mensaje a través de WebSockets.
     * 
     * @param req datos de entrada del mensaje a enviar
     * @param autorId identificador único de quien envía el mensaje
     * @return el MensajeDTO persistido y formateado
     */
    public MensajeDTO enviarMensaje(EnviarMensajeRequest req, String autorId) {
        Conversacion conv = conversacionRepo.findById(req.getConversacionId())
                .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));

        Mensaje mensaje = new Mensaje();
        mensaje.setConversacionId(conv.getId());
        mensaje.setAutorId(autorId);
        mensaje.setContenido(req.getContenido());
        mensaje.setEliminado(false);
        mensaje.setEnviadoEn(LocalDateTime.now());

        if (req.getRespuestaAId() != null) {
            mensajeRepo.findById(req.getRespuestaAId()).ifPresent(m -> {
                mensaje.setRespuestaAId(m.getId());
                mensaje.setRespuestaAContenido(m.getContenido());
                mensaje.setRespuestaAAutorId(m.getAutorId());
            });
        }

        Mensaje guardado = mensajeRepo.save(mensaje);
        MensajeDTO dto = toMensajeDTO(guardado);

        messagingTemplate.convertAndSend("/topic/conversacion/" + conv.getId(), dto);

        String autorNombreFinal = resolverNombre(autorId);
        String contenidoCorto = req.getContenido().length() > 80
                ? req.getContenido().substring(0, 80) + "..."
                : req.getContenido();

        conv.getParticipantes().stream()
                .filter(uid -> !uid.equals(autorId))
                .forEach(uid -> {
                    usuarioRepo.findById(uid).ifPresent(u ->
                            messagingTemplate.convertAndSendToUser(
                                    u.getUsername(),
                                    "/queue/chat-notif",
                                    dto
                            )
                    );
                    notificacionService.crear(
                            uid,
                            "Nuevo mensaje de " + autorNombreFinal,
                            contenidoCorto,
                            "chat",
                            "/chat"
                    );
                });

        return dto;
    }

    /**
     * Agrega o remueve el emoji de reacción en un mensaje específico por parte de un usuario.
     * 
     * @param req datos de la reacción (mensajeId, emoji)
     * @param usuarioId identificador del usuario que ejecuta la reacción
     */
    public void toggleReaccion(ReaccionRequest req, String usuarioId) {
        Optional<Reaccion> existente = reaccionRepo
                .findByMensajeIdAndUsuarioIdAndEmoji(req.getMensajeId(), usuarioId, req.getEmoji());

        if (existente.isPresent()) {
            reaccionRepo.delete(existente.get());
        } else {
            Reaccion r = new Reaccion();
            r.setMensajeId(req.getMensajeId());
            r.setUsuarioId(usuarioId);
            r.setEmoji(req.getEmoji());
            reaccionRepo.save(r);
        }

        Mensaje actualizado = mensajeRepo.findById(req.getMensajeId()).orElseThrow();
        MensajeDTO dto = toMensajeDTO(actualizado);
        messagingTemplate.convertAndSend("/topic/conversacion/" + actualizado.getConversacionId(), dto);
    }

    /**
     * Crea un nuevo canal conversacional de tipo Grupo.
     * 
     * @param nombre nombre visual del grupo
     * @param participanteIds lista de integrantes iniciales
     * @param creadorId identificador del usuario creador
     * @return la conversación grupal en formato DTO
     */
    public ConversacionDTO crearGrupo(String nombre, List<String> participanteIds, String creadorId) {
        List<String> todos = new ArrayList<>(participanteIds);
        if (!todos.contains(creadorId)) todos.add(creadorId);

        Conversacion conv = new Conversacion();
        conv.setNombre(nombre);
        conv.setTipo(TipoConversacion.GRUPO);
        conv.setCreadorId(creadorId);
        conv.setParticipantes(todos);
        conv.setCreadaEn(LocalDateTime.now());

        return toConversacionDTO(conversacionRepo.save(conv), creadorId);
    }

    /**
     * Inicia una conversación directa e individual entre dos usuarios en el sistema.
     * Si ya existía, recupera la conversación previa.
     * 
     * @param usuarioAId primer participante (remitente)
     * @param usuarioBId segundo participante (destinatario)
     * @return la conversación individual resuelta en formato DTO
     */
    public ConversacionDTO abrirConversacionIndividual(String usuarioAId, String usuarioBId) {
        if (usuarioAId.equals(usuarioBId)) {
            throw new RuntimeException("No puedes abrir una conversación contigo mismo");
        }

        List<Conversacion> existentes = conversacionRepo.findByParticipantesContaining(usuarioAId)
                .stream()
                .filter(c -> c.getTipo() == TipoConversacion.INDIVIDUAL
                        && c.getParticipantes().size() == 2
                        && c.getParticipantes().contains(usuarioBId))
                .toList();

        if (!existentes.isEmpty()) {
            return toConversacionDTO(existentes.get(0), usuarioAId);
        }

        Conversacion conv = new Conversacion();
        conv.setTipo(TipoConversacion.INDIVIDUAL);
        conv.setParticipantes(List.of(usuarioAId, usuarioBId));
        conv.setCreadorId(usuarioAId);
        conv.setCreadaEn(LocalDateTime.now());

        return toConversacionDTO(conversacionRepo.save(conv), usuarioAId);
    }

    private MensajeDTO toMensajeDTO(Mensaje m) {
        List<Reaccion> reacciones = reaccionRepo.findByMensajeId(m.getId());
        Map<String, List<String>> reaccionesMap = reacciones.stream()
                .collect(Collectors.groupingBy(
                        Reaccion::getEmoji,
                        Collectors.mapping(Reaccion::getUsuarioId, Collectors.toList())
                ));

        String autorNombre = resolverNombre(m.getAutorId());
        String respuestaAAutor = m.getRespuestaAAutorId() != null
                ? resolverNombre(m.getRespuestaAAutorId()) : null;

        MensajeDTO dto = new MensajeDTO();
        dto.setId(m.getId());
        dto.setConversacionId(m.getConversacionId());
        dto.setAutorId(m.getAutorId());
        dto.setAutorNombre(autorNombre);
        dto.setContenido(m.getContenido());
        dto.setReacciones(reaccionesMap);
        dto.setEnviadoEn(m.getEnviadoEn());
        dto.setRespuestaAId(m.getRespuestaAId());
        dto.setRespuestaAContenido(m.getRespuestaAContenido());
        dto.setRespuestaAAutor(respuestaAAutor);
        dto.setAutorFoto(resolverFoto(m.getAutorId()));
        dto.setEditadoEn(m.getEditadoEn());
        dto.setFijado(m.isFijado());
        dto.setMenciones(m.getMenciones());
        return dto;
    }

    private ConversacionDTO toConversacionDTO(Conversacion c, String usuarioId) {
        List<UsuarioResumenDTO> participantes = c.getParticipantes().stream()
                .map(uid -> {
                    String nombre = resolverNombre(uid);
                    String iniciales = generarIniciales(nombre);
                    String rol = resolverRol(uid);
                    String foto = resolverFoto(uid);
                    return new UsuarioResumenDTO(uid, nombre, iniciales, rol, foto);
                })
                .collect(Collectors.toList());

        List<Mensaje> msgs = mensajeRepo
                .findByConversacionIdAndEliminadoFalseOrderByEnviadoEnAsc(c.getId());
        MensajeDTO ultimo = msgs.isEmpty() ? null : toMensajeDTO(msgs.get(msgs.size() - 1));

        String nombre = c.getNombre();
        if (nombre == null && c.getTipo() == TipoConversacion.INDIVIDUAL) {
            nombre = participantes.stream()
                    .filter(p -> !p.getId().equals(usuarioId))
                    .map(UsuarioResumenDTO::getNombre)
                    .findFirst().orElse("Conversación");
        }

        ConversacionDTO dto = new ConversacionDTO();
        dto.setId(c.getId());
        dto.setNombre(nombre);
        dto.setTipo(c.getTipo());
        dto.setParticipantes(participantes);
        dto.setUltimoMensaje(ultimo);
        dto.setNoLeidos(0);
        return dto;
    }

    private String resolverNombre(String usuarioId) {
        return usuarioRepo.findById(usuarioId)
                .map(u -> {
                    if (u.getEmpleadoId() != null) {
                        return empleadoRepo.findById(u.getEmpleadoId())
                                .map(e -> e.getNombre())
                                .orElse(u.getUsername());
                    }
                    return u.getUsername();
                })
                .orElse("Usuario");
    }

    private String resolverRol(String usuarioId) {
        return usuarioRepo.findById(usuarioId)
                .map(u -> {
                    if (u.getEmpleadoId() != null) {
                        return empleadoRepo.findById(u.getEmpleadoId())
                                .map(e -> e.getRolEmpresa() != null ? e.getRolEmpresa().name() : "")
                                .orElse("");
                    }
                    return u.getRolSistema() != null ? u.getRolSistema().name() : "";
                })
                .orElse("");
    }
    
    private String resolverFoto(String usuarioId) {
        return usuarioRepo.findById(usuarioId)
                .map(u -> {
                    if (u.getEmpleadoId() != null) {
                        return empleadoRepo.findById(u.getEmpleadoId())
                                .map(e -> e.getFoto())
                                .orElse(null);
                    }
                    return null;
                })
                .orElse(null);
    }

    private String generarIniciales(String nombre) {
        if (nombre == null || nombre.isBlank()) return "?";
        String[] partes = nombre.trim().split("\\s+");
        if (partes.length >= 2) {
            return String.valueOf(partes[0].charAt(0)).toUpperCase()
                    + String.valueOf(partes[1].charAt(0)).toUpperCase();
        }
        return nombre.substring(0, Math.min(2, nombre.length())).toUpperCase();
    }
    public List<MensajeDTO> getMensajesFijados(String conversacionId) {
        return mensajeRepo.findByConversacionIdAndEliminadoFalseOrderByEnviadoEnAsc(conversacionId)
                .stream()
                .filter(Mensaje::isFijado)
                .map(this::toMensajeDTO)
                .toList();
    }

    public MensajeDTO toMensajeDTOPublico(Mensaje m) {
        return toMensajeDTO(m);
    }

}