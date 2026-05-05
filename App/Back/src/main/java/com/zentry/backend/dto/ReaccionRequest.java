package com.zentry.backend.dto;

import lombok.Data;

@Data
public class ReaccionRequest {
    private String mensajeId;
    private String emoji;
}