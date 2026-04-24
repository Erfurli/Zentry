package com.zentry.backend.dto;

public record MeResponse(
        Long userId,
        Long empleadoId,
        String username,
        String rol,
        String nombre,
        String email,
        String departamento,
        String puesto
) {
}