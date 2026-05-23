package com.zentry.backend.controller;

import com.zentry.backend.model.Equipo;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.model.RolEmpresa;
import com.zentry.backend.repository.EquipoRepository;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipos")
public class EquipoController {

    private final EquipoRepository equipoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final UsuarioRepository usuarioRepository;

    public EquipoController(EquipoRepository equipoRepository,
                            EmpleadoRepository empleadoRepository,
                            UsuarioRepository usuarioRepository) {
        this.equipoRepository = equipoRepository;
        this.empleadoRepository = empleadoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/personal")
    public ResponseEntity<List<Empleado>> getMisEmpleados(Authentication authentication) {
        Usuario usuarioActual = usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        boolean esAdmin = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("ROLE_ADMIN"));

        if (esAdmin) {
            return ResponseEntity.ok(empleadoRepository.findAll());
        }

        Empleado mando = empleadoRepository.findById(usuarioActual.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Perfil de empleado no encontrado"));

        List<Empleado> miEquipo = empleadoRepository.findAll().stream()
                .filter(e -> Boolean.TRUE.equals(e.getActivo()))
                .filter(e -> e.getDepartamento() != null && e.getDepartamento().equalsIgnoreCase(mando.getDepartamento()))
                .toList();

        return ResponseEntity.ok(miEquipo);
    }

    @GetMapping("/subequipos")
    public ResponseEntity<List<Equipo>> getSubequipos(Authentication authentication) {
        boolean esAdmin = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("ROLE_ADMIN"));

        if (esAdmin) {
            return ResponseEntity.ok(equipoRepository.findAll());
        }

        Usuario usuarioActual = usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Empleado mando = empleadoRepository.findById(usuarioActual.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        List<Equipo> susSubequipos = equipoRepository.findByDepartamentoIgnoreCase(mando.getDepartamento());
        return ResponseEntity.ok(susSubequipos);
    }

    @PostMapping("/subequipos")
    public ResponseEntity<Equipo> guardarSubequipo(@RequestBody Equipo equipo, Authentication authentication) {
        boolean esAdmin = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("ROLE_ADMIN"));

        if (!esAdmin) {
            Usuario usuarioActual = usuarioRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            Empleado mando = empleadoRepository.findById(usuarioActual.getEmpleadoId())
                    .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

            equipo.setDepartamento(mando.getDepartamento());
        }

        return ResponseEntity.ok(equipoRepository.save(equipo));
    }
    @DeleteMapping("/subequipos/{id}")
    public ResponseEntity<Void> eliminarSubequipo(@PathVariable String id, Authentication authentication) {
        boolean esAdmin = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("ROLE_ADMIN"));

        if (!equipoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        equipoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

}