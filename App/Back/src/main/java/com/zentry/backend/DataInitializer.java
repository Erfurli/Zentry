package com.zentry.backend;

import com.zentry.backend.entity.Conversacion;
import com.zentry.backend.entity.TipoConversacion;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.repository.ConversacionRepository;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final ConversacionRepository conversacionRepo;
    private final UsuarioRepository usuarioRepo;
    private final EmpleadoRepository empleadoRepo;

    @Override
    public void run(String... args) {
        List<Usuario> usuarios = usuarioRepo.findAll();
        if (usuarios.isEmpty()) return;

        List<String> todosIds = usuarios.stream()
                .map(Usuario::getId)
                .toList();

        boolean existeGeneral = conversacionRepo.findAll().stream()
                .anyMatch(c -> c.getTipo() == TipoConversacion.GRUPO
                        && "General".equals(c.getNombre()));

        if (!existeGeneral) {
            Conversacion general = Conversacion.builder()
                    .nombre("General")
                    .tipo(TipoConversacion.GRUPO)
                    .participantes(todosIds)
                    .creadorId(todosIds.get(0))
                    .creadaEn(LocalDateTime.now())
                    .build();
            conversacionRepo.save(general);
            System.out.println("Canal general creado");
        }

        List<String> jefesIds = usuarios.stream()
                .filter(u -> {
                    if (u.getEmpleadoId() == null) return false;
                    return empleadoRepo.findById(u.getEmpleadoId())
                            .map(e -> e.getRolEmpresa() != null &&
                                    !e.getRolEmpresa().name().equals("EMPLEADO"))
                            .orElse(false);
                })
                .map(Usuario::getId)
                .toList();

        if (jefesIds.size() > 1) {
            boolean existeJefes = conversacionRepo.findAll().stream()
                    .anyMatch(c -> c.getTipo() == TipoConversacion.JEFES);

            if (!existeJefes) {
                Conversacion jefes = Conversacion.builder()
                        .nombre("Jefes")
                        .tipo(TipoConversacion.JEFES)
                        .participantes(jefesIds)
                        .creadorId(jefesIds.get(0))
                        .creadaEn(LocalDateTime.now())
                        .build();
                conversacionRepo.save(jefes);
                System.out.println("canal jefes creado");
            }
        }

        Map<String, List<String>> porDepartamento = new HashMap<>();
        for (Usuario u : usuarios) {
            if (u.getEmpleadoId() == null) continue;
            empleadoRepo.findById(u.getEmpleadoId()).ifPresent(emp -> {
                String depto = emp.getDepartamento();
                if (depto != null && !depto.isBlank()) {
                    porDepartamento.computeIfAbsent(depto, k -> new ArrayList<>()).add(u.getId());
                }
            });
        }

        for (Map.Entry<String, List<String>> entry : porDepartamento.entrySet()) {
            String depto = entry.getKey();
            List<String> ids = entry.getValue();
            if (ids.size() < 2) continue;

            String nombreCanal = "Depto: " + depto;
            boolean existe = conversacionRepo.findAll().stream()
                    .anyMatch(c -> nombreCanal.equals(c.getNombre()));

            if (!existe) {
                Conversacion canal = Conversacion.builder()
                        .nombre(nombreCanal)
                        .tipo(TipoConversacion.DEPARTAMENTO)
                        .participantes(ids)
                        .creadorId(ids.get(0))
                        .creadaEn(LocalDateTime.now())
                        .build();
                conversacionRepo.save(canal);
                System.out.println("Canal " + nombreCanal + " creado");
            }
        }
    }
}