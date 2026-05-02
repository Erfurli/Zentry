<<<<<<< HEAD
package com.zentry.backend.repository;

import com.zentry.backend.model.Usuario;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UsuarioRepository extends MongoRepository<Usuario, String> {
    Optional<Usuario> findByUsername(String username);
=======
package com.zentry.backend.repository;

import com.zentry.backend.model.Usuario;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UsuarioRepository extends MongoRepository<Usuario, String> {
    Optional<Usuario> findByUsername(String username);
>>>>>>> 18537ca3b30c22e21f03fbfa18e3a3c5afbd546c
}