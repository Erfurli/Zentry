package com.zentry.backend.dto;

public record AuthResponse(
        String token,
        Long userId,
        Long empleadoId,
        String username,
        String rol
) {
}