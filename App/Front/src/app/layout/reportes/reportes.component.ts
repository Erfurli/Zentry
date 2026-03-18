import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

type TipoReporte = 'Asistencia' | 'Vacaciones' | 'Ausencias' | 'Rendimiento';
type EstadoReporte = 'Generado' | 'Pendiente' | 'Error';

interface Reporte {
  id: number;
  nombre: string;
  tipo: TipoReporte;
  departamento: string;
  fechaGeneracion: string;
  periodo: string;
  registros: number;
  estado: EstadoReporte;
}

@Component({
  selector: 'app-reportes',
  imports: [RouterLink],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesComponent {
  readonly reportes = signal<Reporte[]>([
    { id: 1, nombre: 'Asistencia Marzo 2025',       tipo: 'Asistencia',   departamento: 'Todos',  fechaGeneracion: '01/04/2025', periodo: 'Mar 2025', registros: 450, estado: 'Generado' },
    { id: 2, nombre: 'Vacaciones Q1 2025',           tipo: 'Vacaciones',   departamento: 'Todos',  fechaGeneracion: '31/03/2025', periodo: 'Q1 2025',  registros: 38,  estado: 'Generado' },
    { id: 3, nombre: 'Ausencias IT Febrero',         tipo: 'Ausencias',    departamento: 'IT',     fechaGeneracion: '05/03/2025', periodo: 'Feb 2025', registros: 12,  estado: 'Generado' },
    { id: 4, nombre: 'Rendimiento RRHH Marzo',       tipo: 'Rendimiento',  departamento: 'RRHH',   fechaGeneracion: '02/04/2025', periodo: 'Mar 2025', registros: 24,  estado: 'Pendiente' },
    { id: 5, nombre: 'Asistencia Febrero 2025',      tipo: 'Asistencia',   departamento: 'Ventas', fechaGeneracion: '03/03/2025', periodo: 'Feb 2025', registros: 310, estado: 'Generado' },
    { id: 6, nombre: 'Ausencias Globales Q1',        tipo: 'Ausencias',    departamento: 'Todos',  fechaGeneracion: '01/04/2025', periodo: 'Q1 2025',  registros: 57,  estado: 'Error'    },
    { id: 7, nombre: 'Vacaciones Verano Previsión',  tipo: 'Vacaciones',   departamento: 'Todos',  fechaGeneracion: '15/03/2025', periodo: 'Jun-Sep',  registros: 89,  estado: 'Generado' },
    { id: 8, nombre: 'Rendimiento Global Q1',        tipo: 'Rendimiento',  departamento: 'Todos',  fechaGeneracion: '02/04/2025', periodo: 'Q1 2025',  registros: 150, estado: 'Pendiente' },
  ]);

  readonly filtroTipo = signal<TipoReporte | 'Todos'>('Todos');
  readonly filtroDepartamento = signal<string>('Todos');

  readonly reportesFiltrados = computed(() => {
    const tipo  = this.filtroTipo();
    const depto = this.filtroDepartamento();
    return this.reportes().filter(r => {
      const coincideTipo  = tipo  === 'Todos' || r.tipo  === tipo;
      const coincideDepto = depto === 'Todos' || r.departamento === depto;
      return coincideTipo && coincideDepto;
    });
  });

  readonly totalGenerados = computed(() =>
    this.reportes().filter(r => r.estado === 'Generado').length
  );
  readonly totalPendientes = computed(() =>
    this.reportes().filter(r => r.estado === 'Pendiente').length
  );
  readonly totalErrores = computed(() =>
    this.reportes().filter(r => r.estado === 'Error').length
  );
  readonly totalRegistros = computed(() =>
    this.reportes().reduce((acc, r) => acc + r.registros, 0)
  );

  cambiarFiltroTipo(valor: string): void {
    this.filtroTipo.set(valor as TipoReporte | 'Todos');
  }

  cambiarFiltroDepartamento(valor: string): void {
    this.filtroDepartamento.set(valor);
  }

  descargar(reporte: Reporte): void {
    alert(`Descargando reporte "${reporte.nombre}" del backend...`);
  }

  regenerar(reporte: Reporte): void {
    alert(`Regenerando reporte "${reporte.nombre}" en el backend...`);
  }

  nuevoReporte(): void {
    alert('Abriendo formulario de nuevo reporte en el backend...');
  }
}