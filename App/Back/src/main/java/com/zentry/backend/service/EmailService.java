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

    private void enviar(String toEmail, String toNombre, String asunto, String cuerpo) {
        try {
            String credentials = Base64.getEncoder().encodeToString(
                    (apiKey + ":" + apiSecret).getBytes()
            );

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
                    escapeJson(fromEmail),
                    escapeJson(fromName),
                    escapeJson(toEmail),
                    escapeJson(toNombre),
                    escapeJson(asunto),
                    escapeJson(cuerpo)
            );

            System.out.println("JSON enviado a Mailjet:\n" + json);

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
        } catch (Exception e) {
            System.err.println("Error enviando email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // para reemplazar enlaces por texto
    private void enviarHtml(String toEmail, String toNombre, String asunto, String htmlCuerpo) {
        try {
            String credentials = Base64.getEncoder().encodeToString(
                    (apiKey + ":" + apiSecret).getBytes()
            );

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
                    escapeJson(fromEmail),
                    escapeJson(fromName),
                    escapeJson(toEmail),
                    escapeJson(toNombre),
                    escapeJson(asunto),
                    escapeJson(htmlCuerpo)
            );

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
        } catch (Exception e) {
            System.err.println("Error enviando email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void enviarSugerenciaVacaciones(String email, String nombre,
                                           String nuevaFechaInicio, String nuevaFechaFin) {
        enviar(
                email, nombre,
                "Zentry - Sugerencia de cambio de vacaciones",
                "Hola " + nombre + ", se ha sugerido un cambio en tus vacaciones. " +
                        "Nuevas fechas: " + nuevaFechaInicio + " a " + nuevaFechaFin + ". " +
                        "Accede a Zentry para aceptar o rechazar."
        );
    }

    public void enviarCambioEstadoVacaciones(String email, String nombre, String estado) {
        enviar(
                email, nombre,
                "Zentry - Actualizacion de vacaciones",
                "Hola " + nombre + ", tu solicitud de vacaciones ha sido " + estado.toLowerCase() + "."
        );
    }

    // es que si no al JSON no le gusta el correo zzzzzz
    private static String escapeJson(String text) {
        if (text == null) return "";
        return text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    public void enviarRecuperacionPassword(String email, String nombre, String token) {
        String enlace = "http://localhost:4200/resetear-password?token=" + token;
        String cuerpo = """
            <p>Hola %s,</p>
            <p>Has solicitado restablecer tu contraseña en Zentry.</p>
            <p><a href="%s" style="background-color:#264489;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;">Resetear contraseña</a></p>
            <p>El enlace es válido durante 2 horas.</p>
            <p>Si no has solicitado esto, ignora este mensaje.</p>
            <p>El equipo de Zentry</p>
            """.formatted(escapeJson(nombre), enlace);

        enviarHtml(email, nombre, "Zentry - Recuperación de contraseña", cuerpo);
    }


}