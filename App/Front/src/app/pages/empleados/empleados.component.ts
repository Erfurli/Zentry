import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Empleado {
  id: number;
  nombre: string;
  email: string;
  departamento: string;
  puesto: string;
  telefono: string;
  activo: boolean;
  fechaAlta: string;
}

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpleadosComponent {
  readonly empleados = signal<Empleado[]>([
    { id: 1, nombre: 'Ana López', email: 'ana.lopez@zentry.com', departamento: 'RRHH', puesto: 'Director RRHH', telefono: '600123456', activo: true, fechaAlta: '01/01/2024' },
    { id: 2, nombre: 'Carlos García', email: 'carlos.garcia@zentry.com', departamento: 'IT', puesto: 'Desarrollador Senior', telefono: '600123457', activo: true, fechaAlta: '15/03/2024' },
    { id: 3, nombre: 'María Pérez', email: 'maria.perez@zentry.com', departamento: 'Ventas', puesto: 'Ejecutiva Comercial', telefono: '600123458', activo: true, fechaAlta: '20/02/2024' },
    { id: 4, nombre: 'Juan Martínez', email: 'juan.martinez@zentry.com', departamento: 'IT', puesto: 'Soporte Técnico', telefono: '600123459', activo: false, fechaAlta: '10/05/2024' },
    { id: 5, nombre: 'Laura Sánchez', email: 'laura.sanchez@zentry.com', departamento: 'RRHH', puesto: 'Asistente', telefono: '600123460', activo: true, fechaAlta: '05/04/2024' },
  ]);

  readonly filtroDepartamento = signal('Todos');
  readonly filtroEstado = signal('Todos');

  readonly empleadosFiltrados = computed(() => {
    const depto = this.filtroDepartamento();
    const estado = this.filtroEstado();
    return this.empleados().filter(e => {
      const coincideDepto = depto === 'Todos' || e.departamento === depto;
      const coincideEstado = estado === 'Todos' || (estado === 'Activos' ? e.activo : !e.activo);
      return coincideDepto && coincideEstado;
    });
  });

  readonly totalActivos = computed(() => this.empleados().filter(e => e.activo).length);
  readonly totalInactivos = computed(() => this.empleados().filter(e => !e.activo).length);

  cambiarFiltroDepartamento(valor: string): void {
    this.filtroDepartamento.set(valor);
  }

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor);
  }

  onDeptoChange(event: Event): void {
  const select = event.target as HTMLSelectElement;
  this.filtroDepartamento.set(select.value);
}

onEstadoChange(event: Event): void {
  const select = event.target as HTMLSelectElement;
  this.filtroEstado.set(select.value);
}


  toggleActivo(id: number): void {
    this.empleados.update(lista =>
      lista.map(e => e.id === id ? { ...e, activo: !e.activo } : e)
    );
  }
}
