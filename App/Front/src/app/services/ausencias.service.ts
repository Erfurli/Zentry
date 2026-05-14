import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';

export interface AusenciaVista {
  id: string;
  empleadoId: string;
  empleado: string;
  departamento: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  tipo: 'Enfermedad' | 'Asunto Personal' | 'Médico' | 'Familiar';
  estado: 'Pendiente' | 'Justificada' | 'No Justificada';
  motivo?: string;
  fechaSolicitud?: string;
}

export interface SolicitarAusenciaRequest {
  fechaInicio: string;
  fechaFin: string;
  tipo: string;
  motivo?: string;
}

@Injectable({ providedIn: 'root' })
export class AusenciasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ausencias`;

  getVista(tipo?: string, estado?: string): Observable<AusenciaVista[]> {
    const params: Record<string, string> = {};
    if (tipo && tipo !== 'Todos') params['tipo'] = tipo;
    if (estado && estado !== 'Todos') params['estado'] = estado;
    return this.http.get<AusenciaVista[]>(`${this.apiUrl}/vista`, { params });
  }

  getMisAusencias(): Observable<AusenciaVista[]> {
    return this.http.get<AusenciaVista[]>(`${this.apiUrl}/mis-ausencias`);
  }

  solicitar(data: SolicitarAusenciaRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitar`, data);
  }

  justificar(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/justificar`, {});
  }

  noJustificar(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/no-justificar`, {});
  }
}
