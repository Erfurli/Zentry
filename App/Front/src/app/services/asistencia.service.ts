import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';

export interface AsistenciaVista {
  empleadoId: string;
  nombre: string;
  departamento: string;
  estado: 'Presente' | 'Ausente' | 'Retraso';
  entrada: string;
  salida: string;
  fecha: string;
}

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/asistencia`;

  getAsistenciaVista(fecha?: string): Observable<AsistenciaVista[]> {
  const params: Record<string, string> = {};
  if (fecha) params['fecha'] = fecha;

  return this.http.get<AsistenciaVista[]>(`${this.apiUrl}/vista`, { params });
}
}
