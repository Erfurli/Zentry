package com.zentry.backend.controller;

import com.zentry.backend.dto.LoginRequest;
import com.zentry.backend.dto.LoginResponse;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.TokenRecuperacion;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.repository.TokenRecuperacionRepository;
import com.zentry.backend.repository.UsuarioRepository;
import com.zentry.backend.security.JwtService;
import com.zentry.backend.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final EmpleadoRepository empleadoRepository;
    private final TokenRecuperacionRepository tokenRecuperacionRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;


    public AuthController(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UsuarioRepository usuarioRepository,
            EmpleadoRepository empleadoRepository,
            TokenRecuperacionRepository tokenRecuperacionRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
        this.empleadoRepository = empleadoRepository;
        this.tokenRecuperacionRepository = tokenRecuperacionRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;

    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        Usuario usuario = usuarioRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Empleado empleado = empleadoRepository.findById(usuario.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        String token = jwtService.generateToken(userDetails);

        return ResponseEntity.ok(
                LoginResponse.builder()
                        .token(token)
                        .username(usuario.getUsername())
                        .systemRole(usuario.getRolSistema().name())
                        .companyRole(empleado.getRolEmpresa().name())
                        .empleadoId(empleado.getId())
                        .mustChangePassword(Boolean.TRUE.equals(usuario.getMustChangePassword()))
                        .build()
        );
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "username", authentication.getName(),
                "roles", authentication.getAuthorities()
        ));
    }

    @PostMapping("/recuperar-password")
    public ResponseEntity<?> recuperarPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");

        Empleado empleado = empleadoRepository.findByEmail(email).orElse(null);

        if (empleado == null) {
            return ResponseEntity.ok(Map.of("message", "Si el email existe, recibirás un enlace."));
        }

        Usuario usuario = usuarioRepository.findAll().stream()
                .filter(u -> empleado.getId().equals(u.getEmpleadoId()))
                .findFirst()
                .orElse(null);

        if (usuario == null) {
            return ResponseEntity.ok(Map.of("message", "Si el email existe, recibirás un enlace."));
        }

        String token = UUID.randomUUID().toString();
        String expiracion = LocalDateTime.now().plusHours(2).toString();

        TokenRecuperacion tokenRec = TokenRecuperacion.builder()
                .usuarioId(usuario.getId())
                .token(token)
                .fechaExpiracion(expiracion)
                .usado(false)
                .build();

        tokenRecuperacionRepository.save(tokenRec);
        emailService.enviarRecuperacionPassword(email, empleado.getNombre(), token);

        return ResponseEntity.ok(Map.of("message", "Si el email existe, recibirás un enlace."));
    }

    @PostMapping("/resetear-password")
    public ResponseEntity<?> resetearPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String nuevaPassword = body.get("password");

        TokenRecuperacion tokenRec = tokenRecuperacionRepository.findByToken(token).orElse(null);

        if (tokenRec == null || Boolean.TRUE.equals(tokenRec.getUsado())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token inválido o ya usado."));
        }

        LocalDateTime expiracion = LocalDateTime.parse(tokenRec.getFechaExpiracion());
        if (LocalDateTime.now().isAfter(expiracion)) {
            return ResponseEntity.badRequest().body(Map.of("error", "El enlace ha expirado."));
        }

        Usuario usuario = usuarioRepository.findById(tokenRec.getUsuarioId()).orElse(null);

        if (usuario == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Usuario no encontrado."));
        }

        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        usuario.setMustChangePassword(false);
        usuarioRepository.save(usuario);

        tokenRec.setUsado(true);
        tokenRecuperacionRepository.save(tokenRec);

        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada correctamente."));
    }
}

