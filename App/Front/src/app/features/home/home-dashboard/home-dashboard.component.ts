import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface DashboardSummary {
  vacationBalance: number;
  upcomingVacations: { dates: string; status: string }[];
  todayHours: number;
  userName: string;
}

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-dashboard.component.html',
  styleUrls: ['./home-dashboard.component.css']
})
export class HomeDashboardComponent {
  summary: DashboardSummary = {
    vacationBalance: 22,
    upcomingVacations: [
      { dates: '25-29 Mar', status: 'Aprobada' }
    ],
    todayHours: 4.5,
    userName: 'Paula'
  };

  fichar(accion: 'entrada' | 'salida') {
    alert(`Fichando ${accion}...`);
  }

  solicitar(tipo: 'vacaciones' | 'ausencia') {
    alert(`Redirigiendo a ${tipo}...`);
  }
}
