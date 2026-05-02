import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpleadosService, CreateEmpleadoRequest } from '../../../services/empleados.service';
import { Empleado } from '../../../models/empleado.model';

@Component({
  selector: 'app-empleado-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './empleado-modal.component.html',
  styleUrl: './empleado-modal.component.css'
})
export class EmpleadoModalComponent implements OnInit {
  @Input() empleado?: Empleado;
  @Output() cerrar = new EventEmitter<void>();
  @Output() empleadoGuardado = new EventEmitter<Empleado>();

  private fb = inject(FormBuilder);
  private empleadosService = inject(EmpleadosService);

  readonly departamentos: string[] = ['IT', 'RRHH', 'Ventas'];

  loading = false;
  error = '';
  esEdicion = false;

  readonly formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}[A-Za-z]$/)]],
    departamento: ['', Validators.required],
    puesto: ['', [Validators.required, Validators.minLength(2)]],
    fechaAlta: ['', Validators.required],
    activo: [true],
    rolEmpresa: ['', Validators.required]
  });

  ngOnInit(): void {
    if (this.empleado) {
      this.esEdicion = true;
      const partes = this.empleado.nombre.split(' ');
      const nombre = partes[0] ?? '';
      const apellidos = partes.slice(1).join(' ');
      this.formulario.patchValue({
        nombre,
        apellidos,
        email: this.empleado.email,
        dni: this.empleado.dni,
        departamento: this.empleado.departamento,
        puesto: this.empleado.puesto,
        fechaAlta: this.empleado.fechaAlta,
        activo: this.empleado.activo,
        rolEmpresa: this.empleado.rolEmpresa
      });
    }
  }

  get usernameSugerido(): string {
    const nombre = this.formulario.get('nombre')?.value ?? '';
    const apellidos = this.formulario.get('apellidos')?.value ?? '';
    if (!nombre || !apellidos) return '';
    const primerApellido = apellidos.trim().split(' ')[0];
    return `${nombre.trim().toLowerCase()}.${primerApellido.toLowerCase()}`
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const { nombre, apellidos, email, dni, departamento, puesto, fechaAlta, activo, rolEmpresa } =
      this.formulario.getRawValue();

    const datos: CreateEmpleadoRequest = {
      nombre: `${nombre} ${apellidos}`.trim(),
      email: email ?? '',
      dni: dni ?? '',
      departamento: departamento ?? '',
      puesto: puesto ?? '',
      fechaAlta: fechaAlta ?? '',
      activo: activo ?? true,
      rolEmpresa: rolEmpresa ?? ''
    };

    if (this.esEdicion && this.empleado) {
      this.empleadosService.actualizarEmpleado(this.empleado.id, datos).subscribe({
        next: actualizado => {
          this.loading = false;
          this.empleadoGuardado.emit(actualizado);
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudo actualizar el empleado.';
        }
      });
    } else {
      this.empleadosService.crearEmpleado(datos).subscribe({
        next: nuevo => {
          this.loading = false;
          this.empleadoGuardado.emit(nuevo);
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudo crear el empleado.';
        }
      });
    }
  }

  onCerrar(): void {
    if (!this.loading) this.cerrar.emit();
  }
}
