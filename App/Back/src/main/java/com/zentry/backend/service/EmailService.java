package com.zentry.backend.service;

import com.mailjet.client.MailjetClient;
import com.mailjet.client.MailjetRequest;
import com.mailjet.client.MailjetResponse;
import com.mailjet.client.resource.Emailv31;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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

    private MailjetClient getClient() {
        return new MailjetClient(apiKey, apiSecret);
    }

    private void enviar(String toEmail, String toNombre, String asunto, String cuerpo) {
        try {
            MailjetRequest request = new MailjetRequest(Emailv31.resource)
                    .property(Emailv31.MESSAGES, new JSONArray()
                            .put(new JSONObject()
                                    .put(Emailv31.Message.FROM, new JSONObject()
                                            .put("Email", fromEmail)
                                            .put("Name", fromName))
                                    .put(Emailv31.Message.TO, new JSONArray()
                                            .put(new JSONObject()
                                                    .put("Email", toEmail)
                                                    .put("Name", toNombre)))
                                    .put(Emailv31.Message.SUBJECT, asunto)
                                    .put(Emailv31.Message.TEXTPART, cuerpo)));

            MailjetResponse response = getClient().post(request);
            System.out.println("Email enviado. Status: " + response.getStatus());
        } catch (com.mailjet.client.errors.MailjetServerException e) {
            System.err.println("Error Mailjet - Status: " + e.getMessage());
            System.err.println("Response: " + e.toString());
            e.printStackTrace();
        } catch (Exception e) {
            System.err.println("Error general: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void enviarSugerenciaVacaciones(String email, String nombre,
                                           String nuevaFechaInicio, String nuevaFechaFin) {
        enviar(
                email,
                nombre,
                "Zentry — Sugerencia de cambio de vacaciones",
                "Hola " + nombre + ",\n\n" +
                        "Se ha sugerido un cambio en tus vacaciones.\n" +
                        "Nuevas fechas propuestas: " + nuevaFechaInicio + " → " + nuevaFechaFin + "\n\n" +
                        "Accede a Zentry para aceptar o rechazar la sugerencia.\n\n" +
                        "El equipo de Zentry"
        );
    }

    public void enviarCambioEstadoVacaciones(String email, String nombre, String estado) {
        enviar(
                email,
                nombre,
                "Zentry — Actualización de tu solicitud de vacaciones",
                "Hola " + nombre + ",\n\n" +
                        "Tu solicitud de vacaciones ha sido " + estado.toLowerCase() + ".\n\n" +
                        "Accede a Zentry para más detalles.\n\n" +
                        "El equipo de Zentry"
        );
    }
}