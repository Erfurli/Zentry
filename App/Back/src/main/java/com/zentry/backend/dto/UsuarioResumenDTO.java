package com.zentry.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UsuarioResumenDTO {
    private String id;
    private String nombre;
    private String iniciales;
    private String rolEmpresa;
}
