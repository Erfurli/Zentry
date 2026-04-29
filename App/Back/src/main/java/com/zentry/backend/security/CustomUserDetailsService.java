package com.zentry.backend.security;

import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final EmpleadoRepository empleadoRepository;

    public CustomUserDetailsService(
            UsuarioRepository usuarioRepository,
            EmpleadoRepository empleadoRepository
    ) {
        this.usuarioRepository = usuarioRepository;
        this.empleadoRepository = empleadoRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("BUSCANDO USUARIO CON NOMBRE: '" + username + "'");

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> {
                    System.out.println("¡ERROR! Usuario no encontrado en base de datos: '" + username + "'");
                    return new UsernameNotFoundException("Usuario no encontrado");
                });

        System.out.println("USUARIO ENCONTRADO: " + usuario.getUsername());

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new UsernameNotFoundException("Usuario inactivo");
        }

        Empleado empleado = empleadoRepository.findById(usuario.getEmpleadoId())
                .orElseThrow(() -> new UsernameNotFoundException("Empleado no encontrado"));

        if (!Boolean.TRUE.equals(empleado.getActivo())) {
            throw new UsernameNotFoundException("Empleado inactivo");
        }

        return org.springframework.security.core.userdetails.User
                .withUsername(usuario.getUsername())
                .password(usuario.getPassword())
                .authorities("ROLE_" + usuario.getRolSistema().name())
                .build();
    }
}