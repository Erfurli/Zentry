import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService, DashboardSummary } from '../../../services/dashboard.service';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-dashboard.component.html',
  styleUrls: ['./home-dashboard.component.css']
})
export class HomeDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  summary: DashboardSummary = {
    vacationBalance: 0,
    upcomingVacations: [],
    todayHours: 0,
    userName: ''
  };

  loading = true;
  error = '';

  ngOnInit(): void {
    this.dashboardService.getHomeSummary().subscribe({
      next: (data) => {
        console.log('Datos recibidos del backend:', data);
        this.summary = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar dashboard:', err);
        this.error = 'No se pudo cargar el resumen.';
        this.loading = false;
      }
    });
  }

  fichar(accion: 'entrada' | 'salida') {
    alert(`Fichando ${accion}...`);
  }

  solicitar(tipo: 'vacaciones' | 'ausencia') {
    alert(`Redirigiendo a ${tipo}...`);
  }
}
