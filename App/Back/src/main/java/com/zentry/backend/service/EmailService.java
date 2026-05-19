package com.zentry.backend.service;

import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
public class EmailService {

    @Value("${mailjet.api.key}")
    private String apiKey;

    @Value("${mailjet.api.secret}")
    private String apiSecret;

    @Value("${mailjet.from.email}")
    private String fromEmail;

    @Value("${mailjet.from.name}")
    private String fromName;

    private final OkHttpClient client = new OkHttpClient();

    // ─── Envío texto plano ────────────────────────────────────────────────────
    private void enviar(String toEmail, String toNombre, String asunto, String cuerpo) {
        try {
            String credentials = Base64.getEncoder().encodeToString(
                    (apiKey + ":" + apiSecret).getBytes());

            String json = """
                {
                  "Messages": [{
                    "From": {"Email": "%s", "Name": "%s"},
                    "To": [{"Email": "%s", "Name": "%s"}],
                    "Subject": "%s",
                    "TextPart": "%s"
                  }]
                }
                """.formatted(
                    escapeJson(fromEmail), escapeJson(fromName),
                    escapeJson(toEmail),   escapeJson(toNombre),
                    escapeJson(asunto),    escapeJson(cuerpo));

            System.out.println("JSON enviado a Mailjet:\n" + json);
            ejecutarPeticion(json);
        } catch (Exception e) {
            System.err.println("Error enviando email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ─── Envío HTML ───────────────────────────────────────────────────────────
    private void enviarHtml(String toEmail, String toNombre, String asunto, String htmlCuerpo) {
        try {
            String credentials = Base64.getEncoder().encodeToString(
                    (apiKey + ":" + apiSecret).getBytes());

            String json = """
                {
                  "Messages": [{
                    "From": {"Email": "%s", "Name": "%s"},
                    "To": [{"Email": "%s", "Name": "%s"}],
                    "Subject": "%s",
                    "HTMLPart": "%s"
                  }]
                }
                """.formatted(
                    escapeJson(fromEmail), escapeJson(fromName),
                    escapeJson(toEmail),   escapeJson(toNombre),
                    escapeJson(asunto),    escapeJson(htmlCuerpo));

            ejecutarPeticion(json);
        } catch (Exception e) {
            System.err.println("Error enviando email HTML: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void ejecutarPeticion(String json) throws Exception {
        String credentials = Base64.getEncoder().encodeToString(
                (apiKey + ":" + apiSecret).getBytes());

        RequestBody body = RequestBody.create(json, MediaType.parse("application/json"));
        Request request = new Request.Builder()
                .url("https://api.mailjet.com/v3.1/send")
                .post(body)
                .addHeader("Authorization", "Basic " + credentials)
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = client.newCall(request).execute()) {
            System.out.println("Mailjet status: " + response.code());
            System.out.println("Mailjet body: " + response.body().string());
        }
    }

    // ─── Escape JSON ──────────────────────────────────────────────────────────
    private static String escapeJson(String text) {
        if (text == null) return "";
        return text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    // ─── Template base HTML ───────────────────────────────────────────────────
    private String buildEmail(String color, String emoji, String cabecera,
                              String nombre, String titulo, String mensaje,
                              String urlBoton, String textoBoton) {
        return """
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:20px;">
              <div style="background:%s;border-radius:14px 14px 0 0;padding:28px 24px;text-align:center;">
                <div style="font-size:2.5rem;margin-bottom:8px;">%s</div>
                <h1 style="color:white;margin:0;font-size:1.15rem;font-weight:700;">%s</h1>
              </div>
              <div style="background:white;border:1px solid #e2e8f0;border-radius:0 0 14px 14px;padding:32px;">
                <p style="color:#64748b;margin:0 0 6px;font-size:0.95rem;">Hola <strong style="color:#1e293b;">%s</strong>,</p>
                <h2 style="color:#1e293b;margin:16px 0 10px;font-size:1rem;font-weight:700;">%s</h2>
                <p style="color:#64748b;line-height:1.7;margin:0 0 28px;font-size:0.92rem;">%s</p>
                <a href="%s"
                   style="background:%s;color:white;padding:13px 28px;text-decoration:none;border-radius:9px;font-weight:700;font-size:0.9rem;display:inline-block;">
                  %s
                </a>
              </div>
              <p style="color:#94a3b8;font-size:0.75rem;text-align:center;margin-top:16px;">
                Notificación automática de Zentry &middot; Puedes gestionar tus preferencias en la app
              </p>
            </div>
            """.formatted(
                color, emoji, cabecera,
                escapeJson(nombre),
                escapeJson(titulo),
                escapeJson(mensaje),
                urlBoton, color, textoBoton);
    }

    // ─── Emails públicos ──────────────────────────────────────────────────────

    public void enviarSugerenciaVacaciones(String email, String nombre,
                                           String nuevaFechaInicio, String nuevaFechaFin) {
        enviar(email, nombre,
                "Zentry - Sugerencia de cambio de vacaciones",
                "Hola " + nombre + ", se ha sugerido un cambio en tus vacaciones. " +
                        "Nuevas fechas: " + nuevaFechaInicio + " a " + nuevaFechaFin + ". " +
                        "Accede a Zentry para aceptar o rechazar.");
    }

    public void enviarCambioEstadoVacaciones(String email, String nombre, String estado) {
        enviar(email, nombre,
                "Zentry - Actualización de vacaciones",
                "Hola " + nombre + ", tu solicitud de vacaciones ha sido "
                        + estado.toLowerCase() + ".");
    }

    public void enviarRecuperacionPassword(String email, String nombre, String token) {
        String enlace = "http://localhost:4200/resetear-password?token=" + token;
        String cuerpo = buildEmail(
                "#264489", "🔐", "Recuperación de contraseña",
                nombre,
                "Restablece tu contraseña",
                "Has solicitado restablecer tu contraseña en Zentry. " +
                        "Haz clic en el botón para crear una nueva. El enlace es válido durante 2 horas.",
                enlace, "Resetear contraseña");

        enviarHtml(email, nombre, "Zentry - Recuperación de contraseña", cuerpo);
    }

    public void enviarNotificacionVacaciones(String email, String nombre,
                                             String titulo, String mensaje) {
        enviarHtml(email, nombre, "Zentry - " + titulo,
                buildEmail("#10b981", "🏖️", "Actualización de vacaciones",
                        nombre, titulo, mensaje,
                        "http://localhost:4200/vacaciones", "Ver mis vacaciones"));
    }

    public void enviarNotificacionAusencia(String email, String nombre,
                                           String titulo, String mensaje) {
        enviarHtml(email, nombre, "Zentry - " + titulo,
                buildEmail("#f59e0b", "📅", "Actualización de ausencia",
                        nombre, titulo, mensaje,
                        "http://localhost:4200/ausencias", "Ver mis ausencias"));
    }

    public void enviarNotificacionFichaje(String email, String nombre,
                                          String titulo, String mensaje) {
        enviarHtml(email, nombre, "Zentry - " + titulo,
                buildEmail("#3b82f6", "⏱️", "Actualización de fichaje",
                        nombre, titulo, mensaje,
                        "http://localhost:4200/asistencia", "Ver asistencia"));
    }

    public void enviarNotificacionChat(String email, String nombre,
                                       String titulo, String mensaje) {
        enviarHtml(email, nombre, "Zentry - " + titulo,
                buildEmail("#8b5cf6", "💬", "Nuevo mensaje en Zentry",
                        nombre, titulo, mensaje,
                        "http://localhost:4200/chat", "Abrir chat"));
    }

    public void enviarNotificacionSistema(String email, String nombre,
                                          String titulo, String mensaje) {
        enviarHtml(email, nombre, "Zentry - " + titulo,
                buildEmail("#264489", "🔔", "Aviso del sistema",
                        nombre, titulo, mensaje,
                        "http://localhost:4200", "Abrir Zentry"));
    }
}