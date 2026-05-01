import { Component, ChangeDetectionStrategy, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../models/usuario.model';
import { UsuariosService } from '../../services/usuario.service';
import { UsuarioModalComponent } from '../../shared/modals/usuario-modal/usuario-modal.component';


@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, UsuarioModalComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuariosComponent implements OnInit {
  private usuariosService = inject(UsuariosService);

  readonly usuarios = signal<Usuario[]>([]);
  readonly filtroRol = signal('Todos');
  readonly filtroEstado = signal('Todos');
  readonly modalResetAbierto = signal(false);
  readonly nuevaPassword = signal('');
  readonly usuarioReseteando = signal<Usuario | undefined>(undefined);
  readonly modalAbierto = signal(false);
  readonly usuarioEditando = signal<Usuario | undefined>(undefined);

  readonly usuariosFiltrados = computed(() => {
    const rol = this.filtroRol();
    const estado = this.filtroEstado();
    return this.usuarios().filter(u => {
      const coincideRol = rol === 'Todos' || u.rolSistema === rol;
      const coincideEstado = estado === 'Todos' || (estado === 'Activos' ? u.activo : !u.activo);
      return coincideRol && coincideEstado;
    });
  });

  readonly totalActivos = computed(() => this.usuarios().filter(u => u.activo).length);
  readonly totalInactivos = computed(() => this.usuarios().filter(u => !u.activo).length);

  editUsername = '';
  editRol: 'USER' | 'ADMIN' = 'USER';

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.usuariosService.getUsuarios().subscribe({
      next: data => this.usuarios.set(data),
      error: err => console.error('Error cargando usuarios', err)
    });
  }
  guardarEdicion(): void {
    const u = this.usuarioEditando();
    if (!u) return;
    this.usuariosService.actualizar(u.id, { username: this.editUsername, rolSistema: this.editRol }).subscribe({
      next: actualizado => {
        this.usuarios.update(lista => lista.map(x => x.id === actualizado.id ? actualizado : x));
        this.cerrarModal();
      }
    });
  }

  toggleActivo(id: string): void {
    this.usuariosService.toggleActivo(id).subscribe({
      next: actualizado => this.usuarios.update(lista => lista.map(u => u.id === id ? actualizado : u))
    });
  }

  abrirResetPassword(usuario: Usuario): void {
    this.usuarioReseteando.set(usuario);
    this.nuevaPassword.set('');
    this.modalResetAbierto.set(true);
  }

  cerrarResetModal(): void {
    this.modalResetAbierto.set(false);
    this.usuarioReseteando.set(undefined);
  }

  confirmarResetPassword(): void {
    const u = this.usuarioReseteando();
    if (!u || !this.nuevaPassword()) return;
    this.usuariosService.resetPassword(u.id, this.nuevaPassword()).subscribe({
      next: () => this.cerrarResetModal()
    });
  }

  onRolChange(event: Event): void {
    this.filtroRol.set((event.target as HTMLSelectElement).value);
  }

  onEstadoChange(event: Event): void {
    this.filtroEstado.set((event.target as HTMLSelectElement).value);
  }

  abrirModalCrear(): void {
  this.usuarioEditando.set(undefined);
  this.modalAbierto.set(true);
}

abrirModalEditar(usuario: Usuario): void {
  this.usuarioEditando.set(usuario);
  this.modalAbierto.set(true);
}

cerrarModal(): void {
  this.modalAbierto.set(false);
  this.usuarioEditando.set(undefined);
}

onUsuarioGuardado(usuario: Usuario): void {
  this.usuarios.update(lista => {
    const existe = lista.some(u => u.id === usuario.id);
    return existe
      ? lista.map(u => u.id === usuario.id ? usuario : u)
      : [...lista, usuario];
  });
  this.cerrarModal();
}
}
