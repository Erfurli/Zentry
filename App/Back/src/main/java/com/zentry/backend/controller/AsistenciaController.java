package com.zentry.backend.controller;

import com.zentry.backend.dto.AsistenciaVistaDTO;
import com.zentry.backend.model.Asistencia;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.repository.AsistenciaRepository;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.UsuarioRepository;
import com.zentry.backend.service.NotificacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/asistencia")
public class AsistenciaController {

    private final AsistenciaRepository asistenciaRepository;
    private final EmpleadoRepository empleadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final double JORNADA_HORAS = 8.0;

    public AsistenciaController(AsistenciaRepository asistenciaRepository,
                                EmpleadoRepository empleadoRepository,
                                UsuarioRepository usuarioRepository,
                                NotificacionService notificacionService) {
        this.asistenciaRepository = asistenciaRepository;
        this.empleadoRepository = empleadoRepository;
        this.usuarioRepository = usuarioRepository;
        this.notificacionService = notificacionService;
    }


    private String horaActual() {
        return LocalTime.now().format(FMT);
    }

    private String fechaHoy() {
        return LocalDate.now().toString();
    }

    private Empleado resolverEmpleado(Authentication auth) {
        Usuario usuario = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return empleadoRepository.findById(usuario.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
    }

    private Asistencia resolverAsistenciaHoy(String empleadoId) {
        return asistenciaRepository.findByEmpleadoIdAndFecha(empleadoId, fechaHoy())
                .orElseThrow(() -> new RuntimeException("No hay entrada registrada hoy"));
    }

    private double calcularHorasTotales(String entrada, String salida,
                                        String inicioDescanso, String finDescanso) {
        LocalTime tEntrada = LocalTime.parse(entrada, FMT);
        LocalTime tSalida  = LocalTime.parse(salida, FMT);

        long minutosTotales = Duration.between(tEntrada, tSalida).toMinutes();

        if (inicioDescanso != null && finDescanso != null) {
            LocalTime tInicioDesc = LocalTime.parse(inicioDescanso, FMT);
            LocalTime tFinDesc    = LocalTime.parse(finDescanso, FMT);
            minutosTotales -= Duration.between(tInicioDesc, tFinDesc).toMinutes();
        }

        return Math.max(0, Math.round(minutosTotales / 60.0 * 100.0) / 100.0);
    }

    private AsistenciaVistaDTO toResponse(Asistencia a, String nombre, String departamento) {
        return new AsistenciaVistaDTO(
                a.getId(), a.getEmpleadoId(), nombre, departamento,
                a.getEstado() != null ? a.getEstado() : "NO_FICHADO",
                a.getEntrada(), a.getSalida(),
                a.getInicioDescanso(), a.getFinDescanso(),
                a.getHorasTotales(), a.getHorasExtra(),
                a.getFecha()
        );
    }


    @GetMapping
    public List<Asistencia> getAll() {
        return asistenciaRepository.findAll();
    }

    @GetMapping("/vista")
    public List<AsistenciaVistaDTO> getVista(@RequestParam(required = false) String fecha) {
        String fechaBusqueda = fecha != null ? fecha : fechaHoy();
        List<Empleado> empleados = empleadoRepository.findByActivo(true);
        List<Asistencia> asistencias = asistenciaRepository.findByFecha(fechaBusqueda);

        List<AsistenciaVistaDTO> resultado = new ArrayList<>();

        for (Empleado emp : empleados) {
            Optional<Asistencia> opt = asistencias.stream()
                    .filter(a -> a.getEmpleadoId().equals(emp.getId()))
                    .findFirst();

            if (opt.isPresent()) {
                resultado.add(toResponse(opt.get(), emp.getNombre(), emp.getDepartamento()));
            } else {
                resultado.add(new AsistenciaVistaDTO(
                        null, emp.getId(), emp.getNombre(), emp.getDepartamento(),
                        "Ausente", "-", "-", "-", "-", 0.0, 0.0, fechaBusqueda
                ));
            }
        }

        return resultado;
    }

    @GetMapping("/mis-asistencias")
    public List<AsistenciaVistaDTO> getMisAsistencias(Authentication auth,
                                                      @RequestParam(required = false) String fecha) {
        Empleado empleado = resolverEmpleado(auth);

        List<Asistencia> lista = fecha != null
                ? asistenciaRepository.findByFecha(fecha).stream()
                .filter(a -> a.getEmpleadoId().equals(empleado.getId())).toList()
                : asistenciaRepository.findByEmpleadoIdOrderByFechaDesc(empleado.getId());

        return lista.stream()
                .map(a -> toResponse(a, empleado.getNombre(), empleado.getDepartamento()))
                .toList();
    }

    @GetMapping("/hoy")
    public ResponseEntity<AsistenciaVistaDTO> getHoy(Authentication auth) {
        Empleado empleado = resolverEmpleado(auth);
        Optional<Asistencia> opt = asistenciaRepository
                .findByEmpleadoIdAndFecha(empleado.getId(), fechaHoy());

        if (opt.isEmpty()) {
            return ResponseEntity.ok(new AsistenciaVistaDTO(
                    null, empleado.getId(), empleado.getNombre(), empleado.getDepartamento(),
                    "NO_FICHADO", null, null, null, null, 0.0, 0.0, fechaHoy()
            ));
        }

        return ResponseEntity.ok(toResponse(opt.get(), empleado.getNombre(), empleado.getDepartamento()));
    }


    @PostMapping("/entrada")
    public ResponseEntity<Map<String, Object>> ficharEntrada(Authentication auth) {
        Empleado empleado = resolverEmpleado(auth);
        String fecha = fechaHoy();
        String hora  = horaActual();

        Optional<Asistencia> existente = asistenciaRepository
                .findByEmpleadoIdAndFecha(empleado.getId(), fecha);
        if (existente.isPresent() && existente.get().getEntrada() != null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", "Ya has fichado entrada hoy a las " + existente.get().getEntrada()));
        }

        Asistencia asistencia = Asistencia.builder()
                .empleadoId(empleado.getId())
                .fecha(fecha)
                .entrada(hora)
                .estado("TRABAJANDO")
                .build();

        asistenciaRepository.save(asistencia);

        notificacionService.notificarAdmins(
                "Fichaje de entrada",
                empleado.getNombre() + " ha fichado entrada a las " + hora,
                "entrada", "/asistencia"
        );

        return ResponseEntity.ok(Map.of(
                "mensaje", "Entrada registrada a las " + hora,
                "asistencia", toResponse(asistencia, empleado.getNombre(), empleado.getDepartamento())
        ));
    }

    @PostMapping("/descanso/iniciar")
    public ResponseEntity<Map<String, Object>> iniciarDescanso(Authentication auth) {
        Empleado empleado = resolverEmpleado(auth);
        Asistencia asistencia = resolverAsistenciaHoy(empleado.getId());

        if (!"TRABAJANDO".equals(asistencia.getEstado())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", "Solo puedes iniciar descanso si estás trabajando"));
        }

        asistencia.setInicioDescanso(horaActual());
        asistencia.setEstado("EN_DESCANSO");
        asistenciaRepository.save(asistencia);

        return ResponseEntity.ok(Map.of(
                "mensaje", "Descanso iniciado a las " + asistencia.getInicioDescanso(),
                "asistencia", toResponse(asistencia, empleado.getNombre(), empleado.getDepartamento())
        ));
    }

    @PostMapping("/descanso/finalizar")
    public ResponseEntity<Map<String, Object>> finalizarDescanso(Authentication auth) {
        Empleado empleado = resolverEmpleado(auth);
        Asistencia asistencia = resolverAsistenciaHoy(empleado.getId());

        if (!"EN_DESCANSO".equals(asistencia.getEstado())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", "No estás en descanso"));
        }

        asistencia.setFinDescanso(horaActual());
        asistencia.setEstado("TRABAJANDO");
        asistenciaRepository.save(asistencia);

        return ResponseEntity.ok(Map.of(
                "mensaje", "Vuelta del descanso a las " + asistencia.getFinDescanso(),
                "asistencia", toResponse(asistencia, empleado.getNombre(), empleado.getDepartamento())
        ));
    }

    @PostMapping("/salida")
    public ResponseEntity<Map<String, Object>> ficharSalida(Authentication auth) {
        Empleado empleado = resolverEmpleado(auth);
        Asistencia asistencia = resolverAsistenciaHoy(empleado.getId());

        if ("FINALIZADO".equals(asistencia.getEstado())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", "Ya has fichado salida hoy"));
        }

        String hora = horaActual();

        if ("EN_DESCANSO".equals(asistencia.getEstado()) && asistencia.getFinDescanso() == null) {
            asistencia.setFinDescanso(hora);
        }

        asistencia.setSalida(hora);
        asistencia.setEstado("FINALIZADO");

        double horas = calcularHorasTotales(
                asistencia.getEntrada(), hora,
                asistencia.getInicioDescanso(), asistencia.getFinDescanso()
        );
        asistencia.setHorasTotales(horas);
        asistencia.setHorasExtra(Math.max(0, Math.round((horas - JORNADA_HORAS) * 100.0) / 100.0));

        asistenciaRepository.save(asistencia);

        notificacionService.notificarAdmins(
                "Fichaje de salida",
                empleado.getNombre() + " ha fichado salida a las " + hora
                        + " (" + horas + "h trabajadas)",
                "salida", "/asistencia"
        );

        return ResponseEntity.ok(Map.of(
                "mensaje", "Salida registrada. Has trabajado " + horas + " horas.",
                "asistencia", toResponse(asistencia, empleado.getNombre(), empleado.getDepartamento())
        ));
    }

    @PatchMapping("/{id}/corregir")
    public ResponseEntity<Map<String, Object>> corregirAsistencia(
            @PathVariable String id,
            @RequestBody Map<String, String> cambios) {

        Asistencia asistencia = asistenciaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro no encontrado"));

        if (cambios.containsKey("entrada"))        asistencia.setEntrada(cambios.get("entrada"));
        if (cambios.containsKey("salida"))         asistencia.setSalida(cambios.get("salida"));
        if (cambios.containsKey("inicioDescanso")) asistencia.setInicioDescanso(cambios.get("inicioDescanso"));
        if (cambios.containsKey("finDescanso"))    asistencia.setFinDescanso(cambios.get("finDescanso"));

        if (asistencia.getEntrada() != null && asistencia.getSalida() != null) {
            double horas = calcularHorasTotales(
                    asistencia.getEntrada(), asistencia.getSalida(),
                    asistencia.getInicioDescanso(), asistencia.getFinDescanso()
            );
            asistencia.setHorasTotales(horas);
            asistencia.setHorasExtra(Math.max(0, Math.round((horas - JORNADA_HORAS) * 100.0) / 100.0));
            asistencia.setEstado("FINALIZADO");
        }

        asistenciaRepository.save(asistencia);

        return ResponseEntity.ok(Map.of("mensaje", "Registro corregido correctamente"));
    }

    @PostMapping("/{id}/incidencia")
    public ResponseEntity<Map<String, Object>> reportarIncidencia(
            Authentication auth,
            @PathVariable String id,
            @RequestBody Map<String, String> datos) {

        Empleado empleado = resolverEmpleado(auth);

        Asistencia asistencia = asistenciaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro no encontrado"));

        // Aplicar las correcciones sugeridas
        if (datos.containsKey("entrada")        && datos.get("entrada")        != null && !datos.get("entrada").isBlank())
            asistencia.setEntrada(datos.get("entrada"));
        if (datos.containsKey("salida")         && datos.get("salida")         != null && !datos.get("salida").isBlank())
            asistencia.setSalida(datos.get("salida"));
        if (datos.containsKey("inicioDescanso") && datos.get("inicioDescanso") != null && !datos.get("inicioDescanso").isBlank())
            asistencia.setInicioDescanso(datos.get("inicioDescanso"));
        if (datos.containsKey("finDescanso")    && datos.get("finDescanso")    != null && !datos.get("finDescanso").isBlank())
            asistencia.setFinDescanso(datos.get("finDescanso"));

        // Recalcular horas con los datos corregidos
        if (asistencia.getEntrada() != null && asistencia.getSalida() != null) {
            double horas = calcularHorasTotales(
                    asistencia.getEntrada(), asistencia.getSalida(),
                    asistencia.getInicioDescanso(), asistencia.getFinDescanso()
            );
            asistencia.setHorasTotales(horas);
            asistencia.setHorasExtra(Math.max(0, Math.round((horas - JORNADA_HORAS) * 100.0) / 100.0));
        }

        asistenciaRepository.save(asistencia);

        // Construir descripción de la incidencia para notificar a admins
        String tipo        = datos.getOrDefault("tipo", "otro");
        String descripcion = datos.getOrDefault("descripcion", "Sin descripción adicional");

        String tiposMap;
        switch (tipo) {
            case "descanso_olvidado"   -> tiposMap = "Descanso olvidado";
            case "descanso_incorrecto" -> tiposMap = "Horario de descanso incorrecto";
            case "entrada_incorrecta"  -> tiposMap = "Hora de entrada incorrecta";
            case "salida_incorrecta"   -> tiposMap = "Hora de salida incorrecta";
            default                    -> tiposMap = "Otro";
        }

        String resumenCambios = String.format(
                "Tipo: %s | Entrada: %s | Descanso: %s–%s | Salida: %s | Nota: %s",
                tiposMap,
                asistencia.getEntrada()        != null ? asistencia.getEntrada()        : "–",
                asistencia.getInicioDescanso() != null ? asistencia.getInicioDescanso() : "–",
                asistencia.getFinDescanso()    != null ? asistencia.getFinDescanso()    : "–",
                asistencia.getSalida()         != null ? asistencia.getSalida()         : "–",
                descripcion
        );

        notificacionService.notificarAdmins(
                "Incidencia de asistencia",
                empleado.getNombre() + " ha reportado una incidencia. " + resumenCambios,
                "incidencia",
                "/asistencia"
        );

        return ResponseEntity.ok(Map.of(
                "mensaje", "Incidencia registrada. El equipo de RRHH ha sido notificado."
        ));
    }
}