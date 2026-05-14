package com.zentry.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Empleado {

    @Id
    private String id;

    private String nombre;
    private String email;
    private String dni;
    private String departamento;
    private String puesto;
    private String fechaAlta;
    private Boolean activo;
    private RolEmpresa rolEmpresa;

    private String foto;
}