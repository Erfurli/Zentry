import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';

export interface DashboardSummary {
  vacationBalance: number;
  upcomingVacations: { dates: string; status: string }[];
  todayHours: number;
  userName: string;
}

export interface AdminDashboardSummary {
  totalEmpleados: number;
  presentes: number;
  retrasos: number;
  ausentes: number;
  vacacionesPendientes: number;
  ausenciasPendientes: number;
  incidenciasPendientes: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  getHomeSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/home`);
  }

  getAdminSummary(): Observable<AdminDashboardSummary> {
    return this.http.get<AdminDashboardSummary>(`${this.apiUrl}/admin`);
  }
}
