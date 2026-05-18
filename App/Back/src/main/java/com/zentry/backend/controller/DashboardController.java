package com.zentry.backend.controller;

import com.zentry.backend.dto.HomeDashboardResponse;
import com.zentry.backend.model.Asistencia;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.model.Vacaciones;
import com.zentry.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final UsuarioRepository usuarioRepository;
    private final EmpleadoRepository empleadoRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final VacacionesRepository vacacionesRepository;
    private final AusenciaRepository ausenciaRepository;


    @GetMapping("/home")
    public ResponseEntity<HomeDashboardResponse> getHome(Authentication authentication) {
        String username = authentication.getName();

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Empleado empleado = empleadoRepository.findById(usuario.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        String hoy = LocalDate.now().toString();

        Double todayHours = asistenciaRepository.findByEmpleadoIdAndFecha(usuario.getEmpleadoId(), hoy)
                .map(Asistencia::getHorasTotales)
                .orElse(0.0);

        LocalDate ahora = LocalDate.now();

        List<HomeDashboardResponse.VacationItem> upcomingVacations = vacacionesRepository
                .findByEmpleadoId(usuario.getEmpleadoId())
                .stream()
                .filter(v -> !"Rechazada".equalsIgnoreCase(v.getEstado()))
                .filter(v -> LocalDate.parse(v.getFechaInicio()).isAfter(ahora.minusDays(1)))
                .sorted(Comparator.comparing(Vacaciones::getFechaInicio))
                .map(v -> HomeDashboardResponse.VacationItem.builder()
                        .dates(formatRange(v.getFechaInicio(), v.getFechaFin()))
                        .status(v.getEstado())
                        .fechaInicio(v.getFechaInicio())
                        .fechaFin(v.getFechaFin())
                        .build())
                .toList();

        int usedDays = vacacionesRepository.findByEmpleadoId(usuario.getEmpleadoId())
                .stream()
                .filter(v -> "Aprobada".equalsIgnoreCase(v.getEstado()))
                .mapToInt(Vacaciones::getDias)
                .sum();

        int vacationBalance = Math.max(0, 22 - usedDays);

        HomeDashboardResponse response = HomeDashboardResponse.builder()
                .userName(empleado.getNombre())
                .todayHours(todayHours)
                .vacationBalance(vacationBalance)
                .upcomingVacations(upcomingVacations)
                .build();

        return ResponseEntity.ok(response);
    }

    private String formatRange(String start, String end) {
        DateTimeFormatter input = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter dayMonth = DateTimeFormatter.ofPattern("d MMM");

        LocalDate startDate = LocalDate.parse(start, input);
        LocalDate endDate = LocalDate.parse(end, input);

        if (startDate.getMonth().equals(endDate.getMonth())) {
            return startDate.getDayOfMonth() + "-" + endDate.getDayOfMonth() + " " +
                    endDate.format(DateTimeFormatter.ofPattern("MMM"));
        }

        return startDate.format(dayMonth) + " - " + endDate.format(dayMonth);
    }

    @GetMapping("/admin")
    public ResponseEntity<?> getAdmin() {
        String hoy = LocalDate.now().toString();

        long totalEmpleados = empleadoRepository.findByActivo(true).size();

        List<Asistencia> asistenciasHoy = asistenciaRepository.findByFecha(hoy);

        long presentes = asistenciasHoy.stream()
                .filter(a -> "TRABAJANDO".equals(a.getEstado()) || "EN_DESCANSO".equals(a.getEstado()))
                .count();

        long finalizados = asistenciasHoy.stream()
                .filter(a -> "FINALIZADO".equals(a.getEstado()))
                .count();

        long retrasos = asistenciasHoy.stream()
                .filter(a -> a.getEntrada() != null && a.getEntrada().compareTo("09:15") > 0)
                .count();

        long ausentes = totalEmpleados - presentes - finalizados;

        long vacacionesPendientes = vacacionesRepository.findAll().stream()
                .filter(v -> "Pendiente".equalsIgnoreCase(v.getEstado()))
                .count();

        long ausenciasPendientes = ausenciaRepository.findAll().stream()
                .filter(a -> "Pendiente".equalsIgnoreCase(a.getEstado()))
                .count();

        return ResponseEntity.ok(Map.of(
                "totalEmpleados", totalEmpleados,
                "presentes", presentes + finalizados,
                "retrasos", retrasos,
                "ausentes", Math.max(0, ausentes),
                "vacacionesPendientes", vacacionesPendientes,
                "ausenciasPendientes", ausenciasPendientes,
                "incidenciasPendientes", 0
        ));
    }

}