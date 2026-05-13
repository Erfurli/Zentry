package com.zentry.backend.controller;

import com.zentry.backend.dto.AsistenciaVistaDTO;
import com.zentry.backend.model.Asistencia;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.repository.AsistenciaRepository;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.UsuarioRepository;
import com.zentry.backend.service.NotificacionService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/asistencia")
public class AsistenciaController {

    private final AsistenciaRepository asistenciaRepository;
    private final EmpleadoRepository empleadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;

    public AsistenciaController(AsistenciaRepository asistenciaRepository,
                                EmpleadoRepository empleadoRepository,
                                UsuarioRepository usuarioRepository,
                                NotificacionService notificacionService) {
        this.asistenciaRepository = asistenciaRepository;
        this.empleadoRepository = empleadoRepository;
        this.usuarioRepository = usuarioRepository;
        this.notificacionService = notificacionService;
    }

    @GetMapping
    public List<Asistencia> getAll() {
        return asistenciaRepository.findAll();
    }

    @GetMapping("/vista")
    public List<AsistenciaVistaDTO> getVista(@RequestParam(required = false) String fecha) {
        List<Empleado> empleados = empleadoRepository.findByActivo(true);
        List<Asistencia> asistencias = fecha == null
                ? asistenciaRepository.findAll()
                : asistenciaRepository.findByFecha(fecha);

        List<AsistenciaVistaDTO> resultado = new ArrayList<>();

        for (Empleado emp : empleados) {
            Optional<Asistencia> asistenciaOpt = asistencias.stream()
                    .filter(a -> a.getEmpleadoId().equals(emp.getId()))
                    .findFirst();

            String entrada = "-";
            String salida = "-";
            String estado = "Ausente";
            String fechaFinal = fecha != null ? fecha : "";

            if (asistenciaOpt.isPresent()) {
                Asistencia asistencia = asistenciaOpt.get();
                entrada = asistencia.getEntrada() != null ? asistencia.getEntrada() : "-";
                salida = asistencia.getSalida() != null ? asistencia.getSalida() : "-";
                fechaFinal = asistencia.getFecha() != null ? asistencia.getFecha() : fechaFinal;

                if (asistencia.getEntrada() != null) {
                    estado = asistencia.getEntrada().compareTo("09:15") > 0 ? "Retraso" : "Presente";
                }
            }

            resultado.add(new AsistenciaVistaDTO(
                    emp.getId(),
                    emp.getNombre(),
                    emp.getDepartamento(),
                    estado,
                    entrada,
                    salida,
                    fechaFinal
            ));
        }

        return resultado;
    }

    @PostMapping("/entrada")
    public Asistencia ficharEntrada(Authentication authentication) {
        Usuario usuario = usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Empleado empleado = empleadoRepository.findById(usuario.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        String fecha = LocalDate.now().toString();
        String hora = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));

        Asistencia asistencia = Asistencia.builder()
                .empleadoId(empleado.getId())
                .fecha(fecha)
                .entrada(hora)
                .build();

        asistenciaRepository.save(asistencia);

        notificacionService.notificarAdmins(
                "Fichaje de entrada",
                empleado.getNombre() + " ha fichado entrada a las " + hora,
                "entrada",
                "/asistencia"
        );

        return asistencia;
    }

    @PostMapping("/salida")
    public Asistencia ficharSalida(Authentication authentication) {
        Usuario usuario = usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Empleado empleado = empleadoRepository.findById(usuario.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        String fecha = LocalDate.now().toString();
        String hora = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));

        Asistencia asistencia = asistenciaRepository.findByEmpleadoIdAndFecha(empleado.getId(), fecha)
                .orElseThrow(() -> new RuntimeException("No hay entrada registrada hoy"));

        asistencia.setSalida(hora);
        asistenciaRepository.save(asistencia);

        notificacionService.notificarAdmins(
                "Fichaje de salida",
                empleado.getNombre() + " ha fichado salida a las " + hora,
                "salida",
                "/asistencia"
        );

        return asistencia;
    }
}