package com.zentry.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.*;

@Service
public class FestivosService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    private static final Map<Integer, List<String>> FESTIVOS_MADRID = Map.of(
            2025, List.of(
                    "2025-05-02",
                    "2025-07-25",
                    "2025-11-09"
            ),
            2026, List.of(
                    "2026-05-02",
                    "2026-07-25",
                    "2026-11-09"
            )
    );

    public List<Map<String, String>> getFestivos(int year) {
        List<Map<String, String>> resultado = new ArrayList<>();

        try {
            String url = "https://date.nager.at/api/v3/PublicHolidays/" + year + "/ES";
            String json = restTemplate.getForObject(url, String.class);
            JsonNode array = mapper.readTree(json);

            for (JsonNode node : array) {
                Map<String, String> festivo = new HashMap<>();
                festivo.put("fecha", node.get("date").asText());
                festivo.put("nombre", node.get("localName").asText());
                festivo.put("tipo", "NACIONAL");
                resultado.add(festivo);
            }
        } catch (Exception e) {
            System.err.println("Error obteniendo festivos nacionales: " + e.getMessage());
        }

        List<String> festivosMadrid = FESTIVOS_MADRID.getOrDefault(year, List.of());
        Map<String, String> nombresMadrid = Map.of(
                "-05-02", "Fiesta de la Comunidad de Madrid",
                "-07-25", "Santiago Apóstol",
                "-11-09", "Nuestra Señora de la Almudena"
        );

        for (String fecha : festivosMadrid) {
            String sufijo = fecha.substring(4); // -MM-DD
            Map<String, String> festivo = new HashMap<>();
            festivo.put("fecha", fecha);
            festivo.put("nombre", nombresMadrid.getOrDefault(sufijo, "Festivo Madrid"));
            festivo.put("tipo", "COMUNIDAD");
            resultado.add(festivo);
        }

        resultado.sort(Comparator.comparing(f -> f.get("fecha")));
        return resultado;
    }

    public boolean esFestivo(LocalDate fecha, int year) {
        List<Map<String, String>> festivos = getFestivos(year);
        String fechaStr = fecha.toString();
        return festivos.stream().anyMatch(f -> f.get("fecha").equals(fechaStr));
    }
}