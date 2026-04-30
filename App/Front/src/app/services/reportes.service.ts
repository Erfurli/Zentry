import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';

export interface ReporteResumen {
  nombre: string;
  tipo: 'Asistencia' | 'Vacaciones' | 'Ausencias' | 'Empleados';
  departamento: string;
  periodo: string;
  registros: number;
  estado: 'Generado';
  fechaGeneracion: string;
}

export interface ResumenGeneral {
  empleadosActivos: number;
  empleadosInactivos: number;
  vacacionesPendientes: number;
  vacacionesAprobadas: number;
  registrosAsistencia: number;
  retrasos: number;
  ausencias: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reportes`;

  getResumenGeneral(): Observable<ResumenGeneral> {
    return this.http.get<ResumenGeneral>(`${this.apiUrl}/resumen-general`);
  }

  getReportes(tipo?: string, year?: number, month?: number): Observable<ReporteResumen[]> {
    const params: Record<string, string> = {};
    if (tipo && tipo !== 'Todos') params['tipo'] = tipo;
    if (year) params['year'] = String(year);
    if (month) params['month'] = String(month);

    return this.http.get<ReporteResumen[]>(this.apiUrl, { params });
  }
}
