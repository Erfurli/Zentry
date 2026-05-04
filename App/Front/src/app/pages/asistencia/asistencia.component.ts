import { Component, OnInit, inject, computed, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AsistenciaService, AsistenciaVista } from '../../services/asistencia.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.css']
})
export class AsistenciaComponent implements OnInit, AfterViewInit, OnDestroy {
  private asistenciaService = inject(AsistenciaService);
  private chart: Chart | null = null;

  readonly empleados = signal<AsistenciaVista[]>([]);
  readonly filtroDepartamento = signal('Todos');
  readonly filtroEstado = signal('Todos');
  readonly vistaGrafico = signal(false);
  readonly fechaSeleccionada = signal(new Date().toISOString().split('T')[0]);

  readonly esFuturo = computed(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const seleccionada = new Date(this.fechaSeleccionada() + 'T00:00:00');
    return seleccionada > hoy;
  });

  readonly empleadosFiltrados = computed(() => {
    const departamento = this.filtroDepartamento();
    const estado = this.filtroEstado();

    return this.empleados().filter((empleado) => {
      const coincideDepartamento = departamento === 'Todos' || empleado.departamento === departamento;
      const coincideEstado = estado === 'Todos' || empleado.estado === estado;
      return coincideDepartamento && coincideEstado;
    });
  });

  readonly totalPresentes = computed(() =>
    this.empleados().filter(e => e.estado === 'Presente').length
  );
  readonly totalRetrasos = computed(() =>
    this.empleados().filter(e => e.estado === 'Retraso').length
  );
  readonly totalAusentes = computed(() =>
    this.empleados().filter(e => e.estado === 'Ausente').length
  );
  readonly totalEmpleados = computed(() => this.empleados().length);

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  cargarDatos(): void {
    this.asistenciaService.getAsistenciaVista().subscribe({
      next: data => this.empleados.set(data),
      error: err => console.error('Error cargando asistencia', err)
    });
  }

  onDeptoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filtroDepartamento.set(select.value);
    if (this.vistaGrafico()) setTimeout(() => this.renderChart(), 0);
  }

  onEstadoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filtroEstado.set(select.value);
  }

  onFechaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fechaSeleccionada.set(input.value);
    if (this.vistaGrafico()) setTimeout(() => this.renderChart(), 0);
  }

  activarVistaGrafico(): void {
    this.vistaGrafico.set(true);
    setTimeout(() => this.renderChart(), 0);
  }

  activarVistaLista(): void {
    this.vistaGrafico.set(false);
    this.chart?.destroy();
    this.chart = null;
  }

  renderChart(): void {
    this.chart?.destroy();
    const canvas = document.getElementById('donutAsistencia') as HTMLCanvasElement;
    if (!canvas) return;

    const deptoFiltro = this.filtroDepartamento();
    const datos = this.empleados().filter(e =>
      deptoFiltro === 'Todos' || e.departamento === deptoFiltro
    );

    const presentes = datos.filter(e => e.estado === 'Presente').length;
    const retrasos = datos.filter(e => e.estado === 'Retraso').length;
    const ausentes = datos.filter(e => e.estado === 'Ausente').length;
    const total = datos.length;

    const config: ChartConfiguration<'doughnut'> = {
  type: 'doughnut',
  data: {
    labels: ['Presentes', 'Con retraso', 'Ausentes'],
    datasets: [{
      data: [presentes, retrasos, ausentes],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderColor: ['#ffffff', '#ffffff', '#ffffff'],
      borderWidth: 3,
      hoverOffset: 8
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return ` ${ctx.label}: ${val} (${pct}%)`;
          }
        }
      }
    }
  }
};

    this.chart = new Chart<'doughnut'>(canvas, config);
  }

  getPorcentaje(valor: number): number {
    const total = this.totalEmpleados();
    return total > 0 ? Math.round((valor / total) * 100) : 0;
  }
}
