import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, AdminDashboardSummary } from '../../services/dashboard.service';
import { AusenciasService, AusenciaVista } from '../../services/ausencias.service';
import { VacacionesService, VacacionesVista } from '../../services/vacaciones.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService  = inject(DashboardService);
  private ausenciasService  = inject(AusenciasService);
  private vacacionesService = inject(VacacionesService);

  readonly kpis             = signal<AdminDashboardSummary | null>(null);
  readonly ausenciasPend    = signal<AusenciaVista[]>([]);
  readonly vacacionesPend   = signal<VacacionesVista[]>([]);
  readonly cargando         = signal(true);

  ngOnInit(): void {
    forkJoin({
      kpis:       this.dashboardService.getAdminSummary(),
      ausencias:  this.ausenciasService.getVista(),
      vacaciones: this.vacacionesService.getVacacionesVista('Pendiente'),
    }).subscribe({
      next: ({ kpis, ausencias, vacaciones }) => {
        this.kpis.set(kpis);
        this.ausenciasPend.set(ausencias.filter(a => a.estado === 'Pendiente').slice(0, 5));
        this.vacacionesPend.set(vacaciones.slice(0, 5));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
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
}
