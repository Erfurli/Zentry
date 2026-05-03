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
                """.formatted(fromEmail, fromName, toEmail, toNombre, asunto, cuerpo);

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

    public void enviarRecuperacionPassword(String email, String nombre, String token) {
        String enlace = "http://localhost:4200/resetear-password?token=" + token;
        enviar(
                email, nombre,
                "Zentry - Recuperación de contraseña",
                "Hola " + nombre + ",\n\n" +
                        "Has solicitado restablecer tu contraseña en Zentry.\n" +
                        "Haz clic en el siguiente enlace (válido 2 horas):\n\n" +
                        enlace + "\n\n" +
                        "Si no has solicitado esto, ignora este mensaje.\n\n" +
                        "El equipo de Zentry"
        );
    }


}