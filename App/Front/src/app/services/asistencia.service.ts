import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';
import { AsistenciaHoy, AsistenciaVista } from '../models/asistencia.model';

export interface AsistenciaAccionResponse {
  mensaje: string;
  asistencia: AsistenciaHoy;
}

export interface AsistenciaRaw {
  id: string;
  empleadoId: string;
  fecha: string;
  entrada?: string;
  salida?: string;
  horas?: number;
  modo?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AsistenciaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/asistencia`;

  getAsistenciaVista(fecha?: string): Observable<AsistenciaVista[]> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<AsistenciaVista[]>(`${this.apiUrl}/vista`, { params });
  }

  getMisAsistencias(fecha?: string): Observable<AsistenciaVista[]> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<AsistenciaVista[]>(`${this.apiUrl}/mis-asistencias`, {
      params,
    });
  }

  getHoy(): Observable<AsistenciaHoy | null> {
    return this.http.get<AsistenciaHoy | null>(`${this.apiUrl}/hoy`);
  }

  getAll(): Observable<AsistenciaRaw[]> {
    return this.http.get<AsistenciaRaw[]>(this.apiUrl);
  }

  ficharEntrada(): Observable<AsistenciaAccionResponse> {
    return this.http.post<AsistenciaAccionResponse>(
      `${this.apiUrl}/entrada`,
      {},
    );
  }

  iniciarDescanso(): Observable<AsistenciaAccionResponse> {
    return this.http.post<AsistenciaAccionResponse>(
      `${this.apiUrl}/descanso/iniciar`,
      {},
    );
  }

  finalizarDescanso(): Observable<AsistenciaAccionResponse> {
    return this.http.post<AsistenciaAccionResponse>(
      `${this.apiUrl}/descanso/finalizar`,
      {},
    );
  }

  ficharSalida(): Observable<AsistenciaAccionResponse> {
    return this.http.post<AsistenciaAccionResponse>(
      `${this.apiUrl}/salida`,
      {},
    );
  }

  corregirAsistencia(
    id: string,
    cambios: Partial<{
      entrada: string;
      salida: string;
      inicioDescanso: string;
      finDescanso: string;
    }>,
  ): Observable<{ mensaje: string }> {
    return this.http.patch<{ mensaje: string }>(
      `${this.apiUrl}/${id}/corregir`,
      cambios,
    );
  }

  reportarIncidencia(
    id: string,
    datos: {
      tipo: string;
      descripcion?: string;
      entrada?: string;
      salida?: string;
      inicioDescanso?: string;
      finDescanso?: string;
    },
  ): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(
      `${this.apiUrl}/${id}/incidencia`,
      datos,
    );
  }
}