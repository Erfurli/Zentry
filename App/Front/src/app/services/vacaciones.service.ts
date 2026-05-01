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

@Injectable({
  providedIn: 'root'
})
export class VacacionesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/vacaciones`;

  getVacacionesVista(estado?: string, year?: number): Observable<VacacionesVista[]> {
    const params: Record<string, string> = {};
    if (estado && estado !== 'Todos') params['estado'] = estado;
    if (year) params['year'] = String(year);

    return this.http.get<VacacionesVista[]>(`${this.apiUrl}/vista`, { params });
  }

  aprobar(id: string): Observable<VacacionesVista> {
    return this.http.patch<VacacionesVista>(`${this.apiUrl}/${id}/aprobar`, {});
  }

  rechazar(id: string): Observable<VacacionesVista> {
    return this.http.patch<VacacionesVista>(`${this.apiUrl}/${id}/rechazar`, {});
  }
}
