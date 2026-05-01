import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Empleado } from '../models/empleado.model';
import { environment } from '../../enviroments/enviroment';

export interface CreateEmpleadoRequest {
  nombre: string;
  email: string;
  dni: string;
  departamento: string;
  puesto: string;
  fechaAlta: string;
  activo: boolean;
  rolEmpresa: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/empleados`;

  getEmpleados(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(this.apiUrl);
  }

  crearEmpleado(empleado: CreateEmpleadoRequest): Observable<Empleado> {
    return this.http.post<Empleado>(this.apiUrl, empleado);
  }

  actualizarEmpleado(id: string, empleado: CreateEmpleadoRequest): Observable<Empleado> {
    return this.http.put<Empleado>(`${this.apiUrl}/${id}`, empleado);
  }

  toggleActivo(id: string): Observable<Empleado> {
    return this.http.patch<Empleado>(`${this.apiUrl}/${id}/toggle-activo`, {});
  }
}
