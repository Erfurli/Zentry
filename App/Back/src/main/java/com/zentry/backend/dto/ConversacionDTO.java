package com.zentry.backend.dto;

import com.zentry.backend.entity.TipoConversacion;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversacionDTO {
    private String id;
    private String nombre;
    private TipoConversacion tipo;
    private List<UsuarioResumenDTO> participantes;
    private MensajeDTO ultimoMensaje;
    private int noLeidos;
}