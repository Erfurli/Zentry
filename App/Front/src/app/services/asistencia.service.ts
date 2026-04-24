import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { Asistencia } from '../models/asistencia.model';
import { Empleado } from '../models/empleado.model';
import { environment } from '../../enviroments/enviroment';

export interface AsistenciaVista {
  nombre: string;
  departamento: string;
  estado: 'Presente' | 'Ausente' | 'Retraso';
  entrada: string;
  salida: string;
}

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private http = inject(HttpClient);
  private apiAsistencia = `${environment.apiUrl}/asistencia`;
  private apiEmpleados = `${environment.apiUrl}/empleados`;

  getAsistenciaVista(): Observable<AsistenciaVista[]> {
    return forkJoin({
      asistencias: this.http.get<Asistencia[]>(this.apiAsistencia),
      empleados: this.http.get<Empleado[]>(this.apiEmpleados)
    }).pipe(
      map(({ asistencias, empleados }) => {
        return empleados.map(emp => {
          const asistencia = asistencias.find(a => a.empleadoId === emp.id);

          let estado: 'Presente' | 'Ausente' | 'Retraso' = 'Ausente';
          if (asistencia?.entrada) {
            estado = asistencia.entrada > '09:15' ? 'Retraso' : 'Presente';
          }

          return {
            nombre: emp.nombre,
            departamento: emp.departamento,
            estado,
            entrada: asistencia?.entrada ?? '-',
            salida: asistencia?.salida ?? '-'
          };
        });
      })
    );
  }
}
