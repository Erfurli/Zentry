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

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final ConversacionRepository conversacionRepo;
    private final MensajeRepository mensajeRepo;
    private final ReaccionRepository reaccionRepo;
    private final UsuarioRepository usuarioRepo;
    private final EmpleadoRepository empleadoRepo;
    private final SimpMessagingTemplate messagingTemplate;

    public List<ConversacionDTO> getConversacionesDeUsuario(String usuarioId) {
        return conversacionRepo.findByParticipantesContaining(usuarioId)
                .stream().map(c -> toConversacionDTO(c, usuarioId)).toList();
    }

    public List<MensajeDTO> getMensajes(String conversacionId) {
        return mensajeRepo.findByConversacionIdAndEliminadoFalseOrderByEnviadoEnAsc(conversacionId)
                .stream().map(this::toMensajeDTO).toList();
    }

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
        return dto;
    }

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

    public ConversacionDTO abrirConversacionIndividual(String usuarioAId, String usuarioBId) {
        List<Conversacion> existentes = conversacionRepo.findByParticipantesContaining(usuarioAId)
                .stream()
                .filter(c -> c.getTipo() == TipoConversacion.INDIVIDUAL
                        && c.getParticipantes().contains(usuarioBId))
                .toList();

        if (!existentes.isEmpty()) return toConversacionDTO(existentes.get(0), usuarioAId);

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
        return dto;
    }

    private ConversacionDTO toConversacionDTO(Conversacion c, String usuarioId) {
        List<UsuarioResumenDTO> participantes = c.getParticipantes().stream()
                .map(uid -> {
                    String nombre = resolverNombre(uid);
                    String iniciales = generarIniciales(nombre);
                    String rol = resolverRol(uid);
                    return new UsuarioResumenDTO(uid, nombre, iniciales, rol);
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

    private String generarIniciales(String nombre) {
        if (nombre == null || nombre.isBlank()) return "?";
        String[] partes = nombre.trim().split("\\s+");
        if (partes.length >= 2) {
            return String.valueOf(partes[0].charAt(0)).toUpperCase()
                    + String.valueOf(partes[1].charAt(0)).toUpperCase();
        }
        return nombre.substring(0, Math.min(2, nombre.length())).toUpperCase();
    }
}