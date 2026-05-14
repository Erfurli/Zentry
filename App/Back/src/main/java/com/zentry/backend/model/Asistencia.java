package com.zentry.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "attendance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asistencia {

    @Id
    private String id;

    private String empleadoId;
    private String fecha;

    private String entrada;
    private String salida;

    private String inicioDescanso;
    private String finDescanso;

    private String estado; // <--- no fichado, trabajando, en descanso o finalizado

    private Double horasTotales; // <--- descontando el descanso
    private Double horasExtra; // <--- horas extra respecto a la jornada de 8h

    private String modo; // <--- presencial o teletrabajo
}