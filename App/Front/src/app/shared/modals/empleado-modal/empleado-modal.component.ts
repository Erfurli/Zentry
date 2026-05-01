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
  readonly roles: string[] = ['Empleado', 'Admin', 'Mando'];

  loading = false;
  error = '';
  esEdicion = false;

  readonly formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}[A-Za-z]$/)]],
    departamento: ['', Validators.required],
    puesto: ['', [Validators.required, Validators.minLength(2)]],
    fechaAlta: ['', Validators.required],
    activo: [true, Validators.required],
    rolEmpresa: ['', Validators.required]
  });

  ngOnInit(): void {
    if (this.empleado) {
      this.esEdicion = true;
      this.formulario.patchValue({
        nombre: this.empleado.nombre,
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

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const formValue = this.formulario.getRawValue();

    const datos: CreateEmpleadoRequest = {
      nombre: formValue.nombre ?? '',
      email: formValue.email ?? '',
      dni: formValue.dni ?? '',
      departamento: formValue.departamento ?? '',
      puesto: formValue.puesto ?? '',
      fechaAlta: formValue.fechaAlta ?? '',
      activo: formValue.activo ?? true,
      rolEmpresa: formValue.rolEmpresa ?? ''
    };

    if (this.esEdicion && this.empleado) {
      this.empleadosService.actualizarEmpleado(this.empleado.id, datos).subscribe({
        next: (empleadoActualizado) => {
          this.loading = false;
          this.empleadoGuardado.emit(empleadoActualizado);
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudo actualizar el empleado.';
        }
      });
    } else {
      this.empleadosService.crearEmpleado(datos).subscribe({
        next: (nuevoEmpleado) => {
          this.loading = false;
          this.empleadoGuardado.emit(nuevoEmpleado);
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudo crear el empleado.';
        }
      });
    }
  }

  onCerrar(): void {
    if (!this.loading) {
      this.cerrar.emit();
    }
  }
}
