import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DashboardService, DashboardSummary } from '../../../services/dashboard.service';
import { AsistenciaService } from '../../../services/asistencia.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-dashboard.component.html',
  styleUrls: ['./home-dashboard.component.css']
})
export class HomeDashboardComponent implements OnInit {
  private dashboardService  = inject(DashboardService);
  private asistenciaService = inject(AsistenciaService);
  private authService       = inject(AuthService);
  private router            = inject(Router);

  readonly summary  = signal<DashboardSummary | null>(null);
  readonly loading  = signal(true);
  readonly error    = signal('');
  readonly fichando = signal(false);
  readonly mensajeFichaje = signal('');

  readonly horaActual = signal(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
  readonly fechaActual = signal(new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));

  ngOnInit(): void {
    this.dashboardService.getHomeSummary().subscribe({
      next: data => { this.summary.set(data); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el resumen.'); this.loading.set(false); }
    });

    // Actualizar hora cada minuto
    setInterval(() => {
      this.horaActual.set(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
  }

  ficharEntrada(): void {
    this.fichando.set(true);
    this.asistenciaService.ficharEntrada().subscribe({
      next: (res: any) => {
        this.mensajeFichaje.set(res?.mensaje ?? 'Entrada registrada');
        this.fichando.set(false);
        setTimeout(() => this.mensajeFichaje.set(''), 3000);
      },
      error: (err: any) => {
        this.mensajeFichaje.set(err?.error?.mensaje ?? 'Error al fichar');
        this.fichando.set(false);
        setTimeout(() => this.mensajeFichaje.set(''), 3000);
      }
    });
  }

  ficharSalida(): void {
    this.fichando.set(true);
    this.asistenciaService.ficharSalida().subscribe({
      next: (res: any) => {
        this.mensajeFichaje.set(res?.mensaje ?? 'Salida registrada');
        this.fichando.set(false);
        setTimeout(() => this.mensajeFichaje.set(''), 3000);
      },
      error: (err: any) => {
        this.mensajeFichaje.set(err?.error?.mensaje ?? 'Error al fichar');
        this.fichando.set(false);
        setTimeout(() => this.mensajeFichaje.set(''), 3000);
      }
    });
  }

  getBadgeClass(status: string): string {
    if (status === 'Aprobada') return 'badge-aprobada';
    if (status === 'Pendiente') return 'badge-pendiente';
    return 'badge-rechazada';
  }

  getBarraAncho(): number {
    const s = this.summary();
    if (!s) return 0;
    return Math.min(100, Math.round(((22 - s.vacationBalance) / 22) * 100));
  }
}
