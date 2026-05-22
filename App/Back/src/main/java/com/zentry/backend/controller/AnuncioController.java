package com.zentry.backend.controller;

import com.zentry.backend.model.Anuncio;
import com.zentry.backend.model.Empleado;
import com.zentry.backend.model.Usuario;
import com.zentry.backend.repository.AnuncioRepository;
import com.zentry.backend.repository.UsuarioRepository;
import com.zentry.backend.repository.EmpleadoRepository;
import com.zentry.backend.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/anuncios")
@RequiredArgsConstructor
public class AnuncioController {

    private final AnuncioRepository anuncioRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmpleadoRepository empleadoRepository;
    private final NotificacionService notificacionService ;

    /**
     * Obtiene todos los anuncios activos que no han expirado.
     * 
     * @return ResponseEntity con la lista de anuncios vigentes
     */
    @GetMapping
    public ResponseEntity<List<Anuncio>> getAnuncios() {
        LocalDateTime ahora = LocalDateTime.now();
        List<Anuncio> todos = anuncioRepository.findByActivoTrueOrderByDestacadoDescFechaCreacionDesc();
        // Filtrar los expirados
        List<Anuncio> vigentes = todos.stream()
                .filter(a -> a.getFechaExpiracion() == null || a.getFechaExpiracion().isAfter(ahora))
                .toList();
        return ResponseEntity.ok(vigentes);
    }

    /**
     * Obtiene todos los anuncios (activos e inactivos), reservado para administradores.
     * 
     * @param auth la información de autenticación del usuario administrador
     * @return ResponseEntity con la lista de todos los anuncios
     */
    @GetMapping("/admin/todos")
    public ResponseEntity<List<Anuncio>> getTodosAdmin(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(anuncioRepository.findAll());
    }

    /**
     * Crea un nuevo anuncio en el sistema, reservado para administradores.
     * 
     * @param anuncio los datos del anuncio a registrar
     * @param auth la información de autenticación del administrador que publica el anuncio
     * @return ResponseEntity con el anuncio creado y el estado HTTP CREATED
     */
    @PostMapping
    public ResponseEntity<Anuncio> crearAnuncio(@RequestBody Anuncio anuncio, Authentication auth) {
        auth.getAuthorities().forEach(a -> System.out.println("Authority: " + a.getAuthority()));
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        Usuario autor = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String autorNombre = empleadoRepository.findById(autor.getEmpleadoId())
                .map(e -> e.getNombre())
                .orElse(autor.getUsername());

        anuncio.setId(null);
        anuncio.setAutorId(autor.getId());
        anuncio.setAutorNombre(autorNombre);
        anuncio.setFechaCreacion(LocalDateTime.now());
        anuncio.setActivo(true);
        anuncio.setVistoPor(new ArrayList<>());

        Anuncio guardado = anuncioRepository.save(anuncio);

        usuarioRepository.findAll().forEach(u ->
                notificacionService.crear(
                        u.getId(),
                        "Nuevo anuncio: " + anuncio.getTitulo(),
                        anuncio.getContenido().length() > 100
                                ? anuncio.getContenido().substring(0, 100) + "..."
                                : anuncio.getContenido(),
                        "anuncios",
                        "/anuncios"
                )
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    /**
     * Edita los campos editables de un anuncio existente.
     * 
     * @param id el identificador del anuncio a editar
     * @param cambios el objeto con las modificaciones a aplicar
     * @param auth la información de autenticación del administrador
     * @return ResponseEntity con el anuncio actualizado o NOT FOUND si no existe
     */
    @PutMapping("/{id}")
    public ResponseEntity<Anuncio> editarAnuncio(@PathVariable String id,
                                                 @RequestBody Anuncio cambios,
                                                 Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        return anuncioRepository.findById(id).map(existente -> {
            existente.setTitulo(cambios.getTitulo());
            existente.setContenido(cambios.getContenido());
            existente.setCategoria(cambios.getCategoria());
            existente.setFechaExpiracion(cambios.getFechaExpiracion());
            existente.setDestacado(Boolean.TRUE.equals(cambios.getDestacado()));
            return ResponseEntity.ok(anuncioRepository.save(existente));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Cambia el estado de activación (activo/inactivo) de un anuncio.
     * 
     * @param id el identificador del anuncio
     * @param body mapa que contiene la clave "activo" con su respectivo valor booleano
     * @param auth la información de autenticación del administrador
     * @return ResponseEntity con el anuncio modificado
     */
    @PatchMapping("/{id}/estado")
    public ResponseEntity<Anuncio> cambiarEstado(@PathVariable String id,
                                                 @RequestBody Map<String, Boolean> body,
                                                 Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        return anuncioRepository.findById(id).map(a -> {
            a.setActivo(Boolean.TRUE.equals(body.get("activo")));
            return ResponseEntity.ok(anuncioRepository.save(a));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Elimina físicamente un anuncio del sistema.
     * 
     * @param id el identificador del anuncio a eliminar
     * @param auth la información de autenticación del administrador
     * @return ResponseEntity sin contenido que indica el éxito de la operación
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarAnuncio(@PathVariable String id, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        anuncioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Marca un anuncio como visualizado por el usuario autenticado.
     * 
     * @param id el identificador del anuncio visualizado
     * @param auth la información de autenticación del empleado actual
     * @return ResponseEntity con estado OK
     */
    @PostMapping("/{id}/visto")
    public ResponseEntity<Void> marcarVisto(@PathVariable String id, Authentication auth) {
        Usuario usuario = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        anuncioRepository.findById(id).ifPresent(a -> {
            if (a.getVistoPor() == null) a.setVistoPor(new ArrayList<>());
            if (!a.getVistoPor().contains(usuario.getId())) {
                a.getVistoPor().add(usuario.getId());
                anuncioRepository.save(a);
            }
        });
        return ResponseEntity.ok().build();
    }

    /**
     * Obtiene el detalle de un anuncio específico por su identificador.
     * 
     * @param id el identificador del anuncio
     * @return ResponseEntity con el anuncio solicitado
     */
    @GetMapping("/{id}")
    public ResponseEntity<Anuncio> getAnuncio(@PathVariable String id) {
        return anuncioRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Agrega un comentario a un anuncio. Admite la opción de responder a un comentario padre.
     * 
     * @param id el identificador del anuncio a comentar
     * @param body mapa que contiene los datos del comentario (texto, y opcionalmente respuestaAId)
     * @param auth la información de autenticación de quien realiza el comentario
     * @return ResponseEntity con el anuncio y su nueva lista de comentarios
     */
    @PostMapping("/{id}/comentarios")
    public ResponseEntity<Anuncio> comentar(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        Usuario autor = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Empleado empleado = empleadoRepository.findById(autor.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        return anuncioRepository.findById(id).map(anuncio -> {
            if (anuncio.getComentarios() == null) anuncio.setComentarios(new ArrayList<>());

            String respuestaAId    = body.get("respuestaAId");
            String respuestaAAutor = null;
            String respuestaATexto = null;

            if (respuestaAId != null) {
                anuncio.getComentarios().stream()
                        .filter(c -> c.getId().equals(respuestaAId))
                        .findFirst()
                        .ifPresent(c -> {});
                // Resolver autor y texto del comentario padre
                var padre = anuncio.getComentarios().stream()
                        .filter(c -> c.getId().equals(respuestaAId))
                        .findFirst();
                if (padre.isPresent()) {
                    respuestaAAutor = padre.get().getAutorNombre();
                    respuestaATexto = padre.get().getTexto().length() > 80
                            ? padre.get().getTexto().substring(0, 80) + "…"
                            : padre.get().getTexto();
                }
            }

            Anuncio.Comentario comentario = Anuncio.Comentario.builder()
                    .id(java.util.UUID.randomUUID().toString())
                    .autorId(autor.getId())
                    .autorNombre(empleado.getNombre())
                    .autorFoto(empleado.getFoto() != null ? empleado.getFoto() : null)
                    .texto(body.get("texto"))
                    .respuestaAId(respuestaAId)
                    .respuestaAAutor(respuestaAAutor)
                    .respuestaATexto(respuestaATexto)
                    .fecha(LocalDateTime.now())
                    .build();

            anuncio.getComentarios().add(comentario);
            return ResponseEntity.ok(anuncioRepository.save(anuncio));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Elimina un comentario específico de un anuncio.
     * 
     * @param id el identificador del anuncio
     * @param comentarioId el identificador del comentario a remover
     * @param auth la información de autenticación del usuario ejecutor
     * @return ResponseEntity con el anuncio actualizado
     */
    @DeleteMapping("/{id}/comentarios/{comentarioId}")
    public ResponseEntity<Anuncio> eliminarComentario(
            @PathVariable String id,
            @PathVariable String comentarioId,
            Authentication auth) {

        return anuncioRepository.findById(id).map(anuncio -> {
            anuncio.getComentarios().removeIf(c -> c.getId().equals(comentarioId));
            return ResponseEntity.ok(anuncioRepository.save(anuncio));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Permite subir o actualizar la imagen asociada a un anuncio en formato Base64.
     * 
     * @param id el identificador del anuncio
     * @param body mapa conteniendo la clave "imagen" con el string en Base64
     * @param auth la información de autenticación del administrador
     * @return ResponseEntity con el anuncio actualizado
     */
    @PatchMapping("/{id}/imagen")
    public ResponseEntity<Anuncio> subirImagen(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return anuncioRepository.findById(id).map(a -> {
            a.setImagenBase64(body.get("imagen"));
            return ResponseEntity.ok(anuncioRepository.save(a));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Helper para comprobar el rol administrativo de un usuario.
     * 
     * @param auth objeto de autenticación
     * @return true si es administrador, false en caso contrario
     */
    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(r ->
                        r.getAuthority().equals("ROLE_ADMIN") ||
                                r.getAuthority().equals("ADMIN")
                );
    }
}