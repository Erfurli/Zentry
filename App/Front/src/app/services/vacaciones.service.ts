import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { Vacaciones } from '../models/vacaciones.model';
import { Empleado } from '../models/empleado.model';
import { environment } from '../../enviroments/enviroment';

export interface VacacionesVista {
  id: number;
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
  private apiVacaciones = `${environment.apiUrl}/vacaciones`;
  private apiEmpleados = `${environment.apiUrl}/empleados`;

  getVacacionesVista(): Observable<VacacionesVista[]> {
    return forkJoin({
      vacaciones: this.http.get<Vacaciones[]>(this.apiVacaciones),
      empleados: this.http.get<Empleado[]>(this.apiEmpleados)
    }).pipe(
      map(({ vacaciones, empleados }) =>
        vacaciones.map(v => {
          const empleado = empleados.find(e => e.id === v.empleadoId);
          return {
            id: v.id,
            empleado: empleado?.nombre ?? 'Empleado desconocido',
            departamento: empleado?.departamento ?? '-',
            fechaInicio: v.fechaInicio,
            fechaFin: v.fechaFin,
            dias: v.dias,
            estado: v.estado,
            motivo: 'Vacaciones anuales'
          };
        })
      )
    );
  }

  aprobar(id: number): Observable<Vacaciones> {
    return this.http.patch<Vacaciones>(`${this.apiVacaciones}/${id}/aprobar`, {});
  }

  rechazar(id: number): Observable<Vacaciones> {
    return this.http.patch<Vacaciones>(`${this.apiVacaciones}/${id}/rechazar`, {});
  }
}
