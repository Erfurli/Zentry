package com.zentry.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeDashboardResponse {
    private String userName;
    private Double todayHours;
    private Integer vacationBalance;
    private List<VacationItem> upcomingVacations;

    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Data
    public static class VacationItem {
        private String dates;
        private String status;
        private String fechaInicio;
        private String fechaFin;
        private Integer dias;
    }
}