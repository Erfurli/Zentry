package com.zentry.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("sugerencias_vacaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SugerenciaVacaciones {

    @Id
    private String id;

    private String vacacionesId;
    private String empleadoId;
    private String creadoPor;
    private String nuevaFechaInicio;
    private String nuevaFechaFin;
    private Integer nuevosDias;
    private String estado;
    private String fechaCreacion;
    private String mensaje;
}