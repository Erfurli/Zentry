import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Kpi {
  title: string;
  value: string;
  trend: number;
  color: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  kpis: Kpi[] = [
    { title: 'Empleados Activos', value: '150', trend: 2.3, color: '#10B981' },
    { title: 'Presentes Hoy', value: '125', trend: -1.2, color: '#3B82F6' },
    { title: 'Retrasos', value: '15', trend: 5.8, color: '#F59E0B' },
    { title: 'Ausentes', value: '5', trend: 3.1, color: '#EF4444' }
  ];

  solicitudes = {
    vacaciones: 22,
    ausencias: 8,
    incidencias: 3
  };
}
