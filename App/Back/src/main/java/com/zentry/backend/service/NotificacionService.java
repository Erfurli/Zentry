package com.zentry.backend.service;

import com.zentry.backend.model.Notificacion;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.repository.NotificacionRepository;
import com.zentry.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;

    public NotificacionService(NotificacionRepository notificacionRepository,
                               UsuarioRepository usuarioRepository) {
        this.notificacionRepository = notificacionRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public void crear(String usuarioDestinatarioId, String titulo, String mensaje,
                      String tipo, String ruta) {
        Notificacion notif = Notificacion.builder()
                .usuarioDestinatarioId(usuarioDestinatarioId)
                .titulo(titulo)
                .mensaje(mensaje)
                .tipo(tipo)
                .leida(false)
                .ruta(ruta)
                .fecha(LocalDateTime.now())
                .build();
        notificacionRepository.save(notif);
    }

    public void notificarAdmins(String titulo, String mensaje, String tipo, String ruta) {
        List<Usuario> admins = usuarioRepository.findAll().stream()
                .filter(u -> !u.getRolSistema().name().equals("USER"))
                .toList();

        for (Usuario admin : admins) {
            crear(admin.getId(), titulo, mensaje, tipo, ruta);
        }
    }

    public List<Notificacion> getParaUsuario(String usuarioId) {
        return notificacionRepository
                .findByUsuarioDestinatarioIdOrderByFechaDesc(usuarioId);
    }

    public void marcarLeida(String notifId) {
        notificacionRepository.findById(notifId).ifPresent(n -> {
            n.setLeida(true);
            notificacionRepository.save(n);
        });
    }
}