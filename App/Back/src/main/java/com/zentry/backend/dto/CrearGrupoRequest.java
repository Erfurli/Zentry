package com.zentry.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class CrearGrupoRequest {
    private String nombre;
    private List<String> participanteIds;
}
