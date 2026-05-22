import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardSummary } from '../../../services/dashboard.service';
import { AsistenciaService } from '../../../services/asistencia.service';
import { TablonAnunciosComponent } from '../../../pages/anuncios/anuncios.component';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TablonAnunciosComponent],
  templateUrl: './home-dashboard.component.html',
  styleUrls: ['./home-dashboard.component.css']
})
export class HomeDashboardComponent implements OnInit {
  private dashboardService  = inject(DashboardService);
  private asistenciaService = inject(AsistenciaService);

  readonly summary        = signal<DashboardSummary | null>(null);
  readonly loading        = signal(true);
  readonly error          = signal('');
  readonly fichando       = signal(false);
  readonly mensajeFichaje = signal('');
  readonly horaActual     = signal(this.getHora());
  readonly fechaActual    = signal(this.getFecha());

  readonly totalDiasProximos = computed(() => {
    const s = this.summary();
    if (!s || !s.upcomingVacations) return 0;
    return s.upcomingVacations.reduce((acc, vac) => acc + (vac.dias || 0), 0);
  });

  ngOnInit(): void {
    this.dashboardService.getHomeSummary().subscribe({
      next: data => { this.summary.set(data); this.loading.set(false); },
      error: ()   => { this.error.set('No se pudo cargar el resumen.'); this.loading.set(false); }
    });
    setInterval(() => this.horaActual.set(this.getHora()), 60000);
  }

  ficharEntrada(): void {
    this.fichando.set(true);
    this.asistenciaService.ficharEntrada().subscribe({
      next: (res: any) => this.mostrarMensaje(res?.mensaje ?? 'Entrada registrada'),
      error: (err: any) => this.mostrarMensaje(err?.error?.mensaje ?? 'Error al fichar')
    });
  }

  ficharSalida(): void {
    this.fichando.set(true);
    this.asistenciaService.ficharSalida().subscribe({
      next: (res: any) => this.mostrarMensaje(res?.mensaje ?? 'Salida registrada'),
      error: (err: any) => this.mostrarMensaje(err?.error?.mensaje ?? 'Error al fichar')
    });
  }

  getBadgeClass(status: string): string {
    if (status === 'Aprobada')  return 'badge-aprobada';
    if (status === 'Pendiente') return 'badge-pendiente';
    return 'badge-rechazada';
  }

  getBarraAncho(): number {
    const s = this.summary();
    if (!s) return 0;
    return Math.min(100, Math.round(((22 - s.vacationBalance) / 22) * 100));
  }

  formatearFechaVacacion(fechaInicio: string, fechaFin: string): string {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const ini = new Date(fechaInicio + 'T00:00:00');
    const fin = new Date(fechaFin    + 'T00:00:00');
    if (ini.getMonth() === fin.getMonth()) {
      return `${ini.getDate()}–${fin.getDate()} ${fin.toLocaleDateString('es-ES', { month: 'short' })}`;
    }
    return `${ini.toLocaleDateString('es-ES', opts)} – ${fin.toLocaleDateString('es-ES', opts)}`;
  }

  private mostrarMensaje(msg: string): void {
    this.mensajeFichaje.set(msg);
    this.fichando.set(false);
    setTimeout(() => this.mensajeFichaje.set(''), 3000);
  }

  private getHora(): string {
    return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  private getFecha(): string {
    return new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}
