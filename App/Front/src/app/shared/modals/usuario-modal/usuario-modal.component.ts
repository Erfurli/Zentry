import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpleadosService } from '../../../services/empleados.service';
import { Usuario } from '../../../models/usuario.model';
import { Empleado } from '../../../models/empleado.model';
import { UsuariosService } from '../../../services/usuario.service';

@Component({
  selector: 'app-usuario-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-modal.component.html',
  styleUrl: './usuario-modal.component.css'
})
export class UsuarioModalComponent implements OnInit {
  @Input() usuario?: Usuario;
  @Output() cerrar = new EventEmitter<void>();
  @Output() usuarioGuardado = new EventEmitter<Usuario>();

  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private empleadosService = inject(EmpleadosService);

  loading = false;
  error = '';
  esEdicion = false;
  empleados: Empleado[] = [];

  readonly formulario = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    empleadoId: ['', Validators.required],
    rolSistema: ['USER', Validators.required],
    activo: [true],
    password: ['']
  });

  ngOnInit(): void {
    this.empleadosService.getEmpleadosSinUsuario().subscribe({
  next: data => this.empleados = data
});

    if (this.usuario) {
      this.esEdicion = true;
      this.formulario.patchValue({
        username: this.usuario.username,
        empleadoId: this.usuario.empleadoId,
        rolSistema: this.usuario.rolSistema,
        activo: this.usuario.activo
      });
      this.formulario.controls.password.clearValidators();
    } else {
      this.formulario.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    }
    this.formulario.controls.password.updateValueAndValidity();
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const { username, empleadoId, rolSistema, activo, password } = this.formulario.getRawValue();
    const obs = this.esEdicion
  ? this.empleadosService.getEmpleados()
  : this.empleadosService.getEmpleadosSinUsuario();

obs.subscribe({ next: data => this.empleados = data });

    if (this.esEdicion && this.usuario) {
      this.usuariosService.actualizar(this.usuario.id, {
        username: username!,
        empleadoId: empleadoId!,
        rolSistema: rolSistema as 'USER' | 'ADMIN',
        activo: activo!
      }).subscribe({
        next: actualizado => {
          this.loading = false;
          this.usuarioGuardado.emit(actualizado);
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudo actualizar el usuario.';
        }
      });
    } else {
      this.usuariosService.crear({
        username: username!,
        empleadoId: empleadoId!,
        rolSistema: rolSistema as 'USER' | 'ADMIN',
        activo: activo!,
        password: password!
      }).subscribe({
        next: nuevo => {
          this.loading = false;
          this.usuarioGuardado.emit(nuevo);
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudo crear el usuario.';
        }
      });
    }
  }

  onEmpleadoChange(event: Event): void {
  const id = (event.target as HTMLSelectElement).value;
  const emp = this.empleados.find(e => e.id === id);
  if (!emp || this.esEdicion) return;

  const partes = emp.nombre.split(' ');
  const nombre = partes[0] ?? '';
  const primerApellido = partes[1] ?? '';
  const sugerencia = `${nombre}.${primerApellido}`
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  this.formulario.patchValue({ username: sugerencia });
}

  onCerrar(): void {
    if (!this.loading) this.cerrar.emit();
  }
}
