package com.zentry.backend.service;

import com.zentry.backend.entity.PreferenciaNotificacion;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.Notificacion;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.NotificacionRepository;
import com.zentry.backend.repository.PreferenciaNotificacionRepository;
import com.zentry.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmpleadoRepository empleadoRepository;
    private final PreferenciaNotificacionRepository preferenciasRepository;
    private final EmailService emailService;

    public NotificacionService(NotificacionRepository notificacionRepository,
                               UsuarioRepository usuarioRepository,
                               EmpleadoRepository empleadoRepository,
                               PreferenciaNotificacionRepository preferenciasRepository,
                               EmailService emailService) {
        this.notificacionRepository = notificacionRepository;
        this.usuarioRepository      = usuarioRepository;
        this.empleadoRepository     = empleadoRepository;
        this.preferenciasRepository = preferenciasRepository;
        this.emailService           = emailService;
    }

    /**
     * Registra una notificación en la base de datos o por email dependiendo de las preferencias del destinatario.
     * 
     * @param usuarioDestinatarioId identificador del usuario de destino
     * @param titulo encabezado descriptivo de la notificación
     * @param mensaje contenido o cuerpo informativo detallado
     * @param tipo categoría del mensaje (ej: "vacaciones", "ausencia", "chat")
     * @param ruta ruta interna de redireccionamiento de la aplicación al pulsar el aviso
     */
    public void crear(String usuarioDestinatarioId, String titulo, String mensaje,
                      String tipo, String ruta) {

        PreferenciaNotificacion prefs = preferenciasRepository
                .findByUsuarioId(usuarioDestinatarioId).orElse(null);

        boolean inApp = true;
        boolean email = false;

        if (prefs != null && prefs.getPreferencias() != null) {
            PreferenciaNotificacion.TipoPreferencia tipoPref =
                    prefs.getPreferencias().get(tipo);
            if (tipoPref != null) {
                inApp = tipoPref.isInApp();
                email = tipoPref.isEmail();
            }
        }

        if (inApp) {
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

        if (email) {
            enviarEmailNotificacion(usuarioDestinatarioId, titulo, mensaje, tipo);
        }
    }

    /**
     * Envia una alerta interna a todos los usuarios con rol de administrador en el sistema.
     * 
     * @param titulo cabecera
     * @param mensaje cuerpo descriptivo
     * @param tipo categoría del mensaje
     * @param ruta redireccionamiento interno
     */
    public void notificarAdmins(String titulo, String mensaje, String tipo, String ruta) {
        usuarioRepository.findAll().stream()
                .filter(u -> !u.getRolSistema().name().equals("USER"))
                .forEach(admin -> crear(admin.getId(), titulo, mensaje, tipo, ruta));
    }

    private void enviarEmailNotificacion(String usuarioId, String titulo,
                                         String mensaje, String tipo) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) return;

        Empleado empleado = empleadoRepository.findById(usuario.getEmpleadoId())
                .orElse(null);
        if (empleado == null || empleado.getEmail() == null) return;

        switch (tipo) {
            case "vacaciones" -> emailService.enviarNotificacionVacaciones(
                    empleado.getEmail(), empleado.getNombre(), titulo, mensaje);
            case "ausencia"   -> emailService.enviarNotificacionAusencia(
                    empleado.getEmail(), empleado.getNombre(), titulo, mensaje);
            case "entrada", "salida", "incidencia" -> emailService.enviarNotificacionFichaje(
                    empleado.getEmail(), empleado.getNombre(), titulo, mensaje);
            case "chat"       -> emailService.enviarNotificacionChat(
                    empleado.getEmail(), empleado.getNombre(), titulo, mensaje);
            default           -> emailService.enviarNotificacionSistema(
                    empleado.getEmail(), empleado.getNombre(), titulo, mensaje);
        }
    }

    /**
     * Recupera las notificaciones asignadas a un usuario ordenadas por fecha.
     * 
     * @param usuarioId identificador del usuario
     * @return lista de notificaciones correspondientes
     */
    public List<Notificacion> getParaUsuario(String usuarioId) {
        return notificacionRepository
                .findByUsuarioDestinatarioIdOrderByFechaDesc(usuarioId);
    }

    /**
     * Cambia el estado de una notificación a "leída".
     * 
     * @param notifId identificador de la notificación
     */
    public void marcarLeida(String notifId) {
        notificacionRepository.findById(notifId).ifPresent(n -> {
            n.setLeida(true);
            notificacionRepository.save(n);
        });
    }

    /**
     * Cambia de forma masiva el estado de todas las notificaciones de un usuario a "leídas".
     * 
     * @param usuarioId identificador del usuario destino
     */
    public void marcarTodasLeidas(String usuarioId) {
        List<Notificacion> notifs = notificacionRepository
                .findByUsuarioDestinatarioIdOrderByFechaDesc(usuarioId);
        notifs.forEach(n -> n.setLeida(true));
        notificacionRepository.saveAll(notifs);
    }
}