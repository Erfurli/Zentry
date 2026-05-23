import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { DashboardService, AdminDashboardSummary } from '../../services/dashboard.service';
import { AusenciasService, AusenciaVista } from '../../services/ausencias.service';
import { VacacionesService, VacacionesVista } from '../../services/vacaciones.service';
import { AsistenciaService } from '../../services/asistencia.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private dashboardService  = inject(DashboardService);
  private ausenciasService  = inject(AusenciasService);
  private vacacionesService = inject(VacacionesService);
  private asistenciaService = inject(AsistenciaService);

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  readonly kpis           = signal<AdminDashboardSummary | null>(null);
  readonly ausenciasPend  = signal<AusenciaVista[]>([]);
  readonly vacacionesPend = signal<VacacionesVista[]>([]);
  readonly cargando       = signal(true);
  readonly graficaActual  = signal(0);

  private chart: Chart | null = null;
  private datosAsistencia: any[] = [];
  private datosVacaciones: any[] = [];
  private datosAusencias:  any[] = [];

  readonly GRAFICAS = [
    { titulo: 'Asistencia hoy',        icono: 'fa-users',          color: '#3b82f6' },
    { titulo: 'Vacaciones por estado',  icono: 'fa-umbrella-beach', color: '#10b981' },
    { titulo: 'Ausencias por tipo',     icono: 'fa-calendar-xmark', color: '#f59e0b' },
    { titulo: 'Solicitudes pendientes', icono: 'fa-hourglass-half', color: '#8b5cf6' },
  ];

  readonly graficaInfo = computed(() => this.GRAFICAS[this.graficaActual()]);

  ngOnInit(): void {
    forkJoin({
      kpis:       this.dashboardService.getAdminSummary(),
      ausencias:  this.ausenciasService.getVista(),
      vacaciones: this.vacacionesService.getVacacionesVista('Pendiente'),
      asistencia: this.asistenciaService.getAsistenciaVista(),
      todasVac:   this.vacacionesService.getVacacionesVista(),
    }).subscribe({
      next: ({ kpis, ausencias, vacaciones, asistencia, todasVac }) => {
        this.kpis.set(kpis);
        this.ausenciasPend.set(ausencias.filter(a => a.estado === 'Pendiente').slice(0, 5));
        this.vacacionesPend.set(vacaciones.slice(0, 5));
        this.datosAsistencia = asistencia;
        this.datosVacaciones = todasVac;
        this.datosAusencias  = ausencias;
        this.cargando.set(false);
        setTimeout(() => this.renderGrafica(), 100);
      },
      error: () => this.cargando.set(false),
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void { this.chart?.destroy(); }

  anterior(): void {
    this.graficaActual.update(i => (i - 1 + this.GRAFICAS.length) % this.GRAFICAS.length);
    setTimeout(() => this.renderGrafica(), 50);
  }

  siguiente(): void {
    this.graficaActual.update(i => (i + 1) % this.GRAFICAS.length);
    setTimeout(() => this.renderGrafica(), 50);
  }

  irAGrafica(i: number): void {
    this.graficaActual.set(i);
    setTimeout(() => this.renderGrafica(), 50);
  }

  renderGrafica(): void {
    this.chart?.destroy();
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;
    const idx = this.graficaActual();
    if (idx === 0) this.renderAsistencia(canvas);
    else if (idx === 1) this.renderVacaciones(canvas);
    else if (idx === 2) this.renderAusencias(canvas);
    else if (idx === 3) this.renderPendientes(canvas);
  }

  private renderAsistencia(canvas: HTMLCanvasElement): void {
    const presentes = this.datosAsistencia.filter(e =>
      e.estado === 'Presente' || e.estado === 'TRABAJANDO' ||
      e.estado === 'FINALIZADO' || e.estado === 'EN_DESCANSO').length;
    const retrasos  = this.datosAsistencia.filter(e => e.estado === 'Retraso').length;
    const ausentes  = this.datosAsistencia.filter(e =>
      e.estado === 'Ausente' || e.estado === 'NO_FICHADO').length;

    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Presentes', 'Con retraso', 'Ausentes'],
        datasets: [{ data: [presentes, retrasos, ausentes],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } } }
      }
    });
  }

  private renderVacaciones(canvas: HTMLCanvasElement): void {
    const aprobadas  = this.datosVacaciones.filter(v => v.estado === 'Aprobada').length;
    const pendientes = this.datosVacaciones.filter(v => v.estado === 'Pendiente').length;
    const rechazadas = this.datosVacaciones.filter(v => v.estado === 'Rechazada').length;

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Aprobadas', 'Pendientes', 'Rechazadas'],
        datasets: [{ label: 'Solicitudes',
          data: [aprobadas, pendientes, rechazadas],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderRadius: 8, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private renderAusencias(canvas: HTMLCanvasElement): void {
    const tipos  = ['Enfermedad', 'Asunto Personal', 'Médico', 'Familiar'];
    const counts = tipos.map(t => this.datosAusencias.filter((a: any) => a.tipo === t).length);

    this.chart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: tipos,
        datasets: [{ data: counts,
          backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'],
          borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } } }
      }
    });
  }

  private renderPendientes(canvas: HTMLCanvasElement): void {
    const k = this.kpis();
    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Vacaciones', 'Ausencias', 'Incidencias'],
        datasets: [{ label: 'Pendientes',
          data: [k?.vacacionesPendientes ?? 0, k?.ausenciasPendientes ?? 0, k?.incidenciasPendientes ?? 0],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderRadius: 8, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  aprobarVacacion(id: string): void {
    this.vacacionesService.aprobar(id).subscribe(() => {
      this.vacacionesPend.update(l => l.filter(v => v.id !== id));
      this.kpis.update(k => k ? { ...k, vacacionesPendientes: k.vacacionesPendientes - 1 } : k);
    });
  }

  rechazarVacacion(id: string): void {
    this.vacacionesService.rechazar(id).subscribe(() => {
      this.vacacionesPend.update(l => l.filter(v => v.id !== id));
      this.kpis.update(k => k ? { ...k, vacacionesPendientes: k.vacacionesPendientes - 1 } : k);
    });
  }

  justificarAusencia(id: string): void {
    this.ausenciasService.justificar(id).subscribe(() => {
      this.ausenciasPend.update(l => l.filter(a => a.id !== id));
      this.kpis.update(k => k ? { ...k, ausenciasPendientes: k.ausenciasPendientes - 1 } : k);
    });
  }

  noJustificarAusencia(id: string): void {
    this.ausenciasService.noJustificar(id).subscribe(() => {
      this.ausenciasPend.update(l => l.filter(a => a.id !== id));
      this.kpis.update(k => k ? { ...k, ausenciasPendientes: k.ausenciasPendientes - 1 } : k);
    });
  }


  getPct(valor: number): number {
    const k = this.kpis();
    if (!k || k.totalEmpleados === 0) return 0;
    return Math.round((valor / k.totalEmpleados) * 100);
  }
}
