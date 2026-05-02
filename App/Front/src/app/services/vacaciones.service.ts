import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';

export interface VacacionesVista {
  id: string;
  empleadoId: string;
  empleado: string;
  departamento: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  estado: 'Aprobada' | 'Pendiente' | 'Rechazada';
  motivo: string;
}

export interface SugerenciaVacaciones {
  id: string;
  vacacionesId: string;
  empleadoId: string;
  creadoPor: string;
  nuevaFechaInicio: string;
  nuevaFechaFin: string;
  nuevosDias: number;
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada';
  fechaCreacion: string;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class VacacionesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/vacaciones`;
  private sugerenciasUrl = `${environment.apiUrl}/sugerencias`;

  getVacacionesVista(estado?: string, year?: number): Observable<VacacionesVista[]> {
    const params: Record<string, string> = {};
    if (estado && estado !== 'Todos') params['estado'] = estado;
    if (year) params['year'] = String(year);
    return this.http.get<VacacionesVista[]>(`${this.apiUrl}/vista`, { params });
  }

  solicitarVacaciones(fechaInicio: string, fechaFin: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/solicitar`, { fechaInicio, fechaFin });
}

  aprobar(id: string): Observable<VacacionesVista> {
    return this.http.patch<VacacionesVista>(`${this.apiUrl}/${id}/aprobar`, {});
  }

  rechazar(id: string): Observable<VacacionesVista> {
    return this.http.patch<VacacionesVista>(`${this.apiUrl}/${id}/rechazar`, {});
  }

  crearSugerencia(vacacionesId: string, nuevaFechaInicio: string, nuevaFechaFin: string, mensaje?: string): Observable<SugerenciaVacaciones> {
    return this.http.post<SugerenciaVacaciones>(this.sugerenciasUrl, {
      vacacionesId, nuevaFechaInicio, nuevaFechaFin,
      mensaje: mensaje ?? 'Se ha sugerido un cambio de fechas para tus vacaciones.'
    });
  }

  getSugerenciasPendientes(empleadoId: string): Observable<SugerenciaVacaciones[]> {
    return this.http.get<SugerenciaVacaciones[]>(`${this.sugerenciasUrl}/empleado/${empleadoId}/pendientes`);
  }

  aceptarSugerencia(id: string): Observable<SugerenciaVacaciones> {
    return this.http.patch<SugerenciaVacaciones>(`${this.sugerenciasUrl}/${id}/aceptar`, {});
  }

  rechazarSugerencia(id: string): Observable<SugerenciaVacaciones> {
    return this.http.patch<SugerenciaVacaciones>(`${this.sugerenciasUrl}/${id}/rechazar`, {});
  }
}
