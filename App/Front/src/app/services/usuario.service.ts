import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/usuarios`;

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.base);
  }

  actualizar(id: string, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/${id}`, usuario);
  }

  toggleActivo(id: string): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.base}/${id}/toggle-activo`, {});
  }

  resetPassword(id: string, password: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/reset-password`, { password });
  }

  crear(usuario: { username: string; empleadoId: string; rolSistema: 'USER' | 'ADMIN'; activo: boolean; password: string }): Observable<Usuario> {
  return this.http.post<Usuario>(this.base, usuario);
}

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }


}
