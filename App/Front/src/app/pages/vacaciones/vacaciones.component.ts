import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

type EstadoSolicitud = 'Aprobada' | 'Pendiente' | 'Rechazada';

interface SolicitudVacaciones {
  id: number;
  empleado: string;
  departamento: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  estado: EstadoSolicitud;
  motivo: string;
}

@Component({
  selector: 'app-vacaciones',
  imports: [CommonModule],
  templateUrl: './vacaciones.component.html',
  styleUrl: './vacaciones.component.css'
})
export class VacacionesComponent {
  readonly solicitudes = signal<SolicitudVacaciones[]>([
    { id: 1, empleado: 'Ana López',      departamento: 'RRHH',   fechaInicio: '25/03/2025', fechaFin: '29/03/2025', dias: 5,  estado: 'Aprobada',  motivo: 'Vacaciones anuales' },
    { id: 2, empleado: 'Carlos García',  departamento: 'IT',     fechaInicio: '01/04/2025', fechaFin: '11/04/2025', dias: 10, estado: 'Pendiente', motivo: 'Vacaciones anuales' },
    { id: 3, empleado: 'María Pérez',    departamento: 'Ventas', fechaInicio: '15/04/2025', fechaFin: '17/04/2025', dias: 3,  estado: 'Pendiente', motivo: 'Asunto personal'    },
    { id: 4, empleado: 'Juan Martínez',  departamento: 'RRHH',   fechaInicio: '02/03/2025', fechaFin: '06/03/2025', dias: 5,  estado: 'Rechazada', motivo: 'Vacaciones anuales' },
    { id: 5, empleado: 'Laura Sánchez',  departamento: 'IT',     fechaInicio: '10/05/2025', fechaFin: '21/05/2025', dias: 10, estado: 'Aprobada',  motivo: 'Vacaciones anuales' },
    { id: 6, empleado: 'Pedro Romero',   departamento: 'Ventas', fechaInicio: '08/04/2025', fechaFin: '09/04/2025', dias: 2,  estado: 'Pendiente', motivo: 'Viaje familiar'     },
  ]);

  readonly filtroEstado = signal<EstadoSolicitud | 'Todos'>('Todos');
  readonly filtroDepartamento = signal<string>('Todos');

  readonly solicitudesFiltradas = computed(() => {
    const estado = this.filtroEstado();
    const depto = this.filtroDepartamento();
    return this.solicitudes().filter(s => {
      const coincideEstado = estado === 'Todos' || s.estado === estado;
      const coincideDepto  = depto  === 'Todos' || s.departamento === depto;
      return coincideEstado && coincideDepto;
    });
  });

  readonly totalAprobadas = computed(() =>
    this.solicitudes().filter(s => s.estado === 'Aprobada').length
  );
  readonly totalPendientes = computed(() =>
    this.solicitudes().filter(s => s.estado === 'Pendiente').length
  );
  readonly totalRechazadas = computed(() =>
    this.solicitudes().filter(s => s.estado === 'Rechazada').length
  );
  readonly totalDiasSolicitados = computed(() =>
    this.solicitudes().reduce((acc, s) => acc + s.dias, 0)
  );

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor as EstadoSolicitud | 'Todos');
  }

  cambiarFiltroDepartamento(valor: string): void {
    this.filtroDepartamento.set(valor);
  }

  aprobar(id: number): void {
    this.solicitudes.update(lista =>
      lista.map(s => s.id === id ? { ...s, estado: 'Aprobada' as EstadoSolicitud } : s)
    );
  }

  rechazar(id: number): void {
    this.solicitudes.update(lista =>
      lista.map(s => s.id === id ? { ...s, estado: 'Rechazada' as EstadoSolicitud } : s)
    );
  }

  exportar(): void {
    alert('Exportando solicitudes de vacaciones al backend...');
  }
}