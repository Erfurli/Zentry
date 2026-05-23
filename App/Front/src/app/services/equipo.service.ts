import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Equipo {
  id?: string;
  nombre: string;
  departamento: string;
  liderId: string;
  miembrosIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EquipoService {
  private apiUrl = 'http://localhost:8080/api/equipos';

  constructor(private http: HttpClient) {}

  getMisEmpleados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/personal`);
  }

  getSubequipos(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(`${this.apiUrl}/subequipos`);
  }

  crearSubequipo(equipo: Equipo): Observable<Equipo> {
    return this.http.post<Equipo>(`${this.apiUrl}/subequipos`, equipo);
  }

  actualizarSubequipo(equipo: Equipo): Observable<Equipo> {
    return this.http.put<Equipo>(`${this.apiUrl}/subequipos/${equipo.id}`, equipo);
  }

  eliminarSubequipo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subequipos/${id}`);
  }
}
