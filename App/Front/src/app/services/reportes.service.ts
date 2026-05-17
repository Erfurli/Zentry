import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';

export interface ReporteResumen {
  nombre: string;
  tipo: string;
  departamento: string;
  fechaGeneracion: string;
  periodo: string;
  registros: number;
  estado: string;
}

export interface ResumenGeneral {
  empleadosActivos: number;
  empleadosInactivos: number;
  vacacionesPendientes: number;
  vacacionesAprobadas: number;
  ausencias: number;
  registrosAsistencia: number;
  retrasos: number;
}

export interface FiltrosReporte {
  year?: number;
  month?: number;
  estado?: string;
  departamento?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  private api  = `${environment.apiUrl}/reportes`;

  getReportes(tipo?: string, year?: number, month?: number): Observable<ReporteResumen[]> {
    let params = new HttpParams();
    if (tipo  && tipo  !== 'Todos') params = params.set('tipo',  tipo);
    if (year)                        params = params.set('year',  year);
    if (month)                       params = params.set('month', month);
    return this.http.get<ReporteResumen[]>(this.api, { params });
  }

  getResumenGeneral(): Observable<ResumenGeneral> {
    return this.http.get<ResumenGeneral>(`${this.api}/resumen-general`);
  }

  getDatosAsistencia(f: FiltrosReporte = {}): Observable<any[]> {
    let params = new HttpParams();
    if (f.year)          params = params.set('year',         f.year);
    if (f.month)         params = params.set('month',        f.month!);
    if (f.departamento)  params = params.set('departamento', f.departamento);
    return this.http.get<any[]>(`${this.api}/datos/asistencia`, { params });
  }

  getDatosVacaciones(f: FiltrosReporte = {}): Observable<any[]> {
    let params = new HttpParams();
    if (f.year)         params = params.set('year',         f.year!);
    if (f.estado)       params = params.set('estado',       f.estado);
    if (f.departamento) params = params.set('departamento', f.departamento);
    return this.http.get<any[]>(`${this.api}/datos/vacaciones`, { params });
  }

  getDatosAusencias(f: FiltrosReporte = {}): Observable<any[]> {
    let params = new HttpParams();
    if (f.year)         params = params.set('year',         f.year!);
    if (f.estado)       params = params.set('estado',       f.estado);
    if (f.departamento) params = params.set('departamento', f.departamento);
    return this.http.get<any[]>(`${this.api}/datos/ausencias`, { params });
  }
}
