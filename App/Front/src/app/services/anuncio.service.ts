import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Anuncio } from '../models/anuncio.model';

@Injectable({ providedIn: 'root' })
export class AnuncioService {
  private http = inject(HttpClient);
  private base = '/api/anuncios';

  // ── Empleados ────────────────────────────────────────────────────
  getAnuncios(): Observable<Anuncio[]> {
    return this.http.get<Anuncio[]>(this.base);
  }

  marcarVisto(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/visto`, {});
  }

  // ── Admin ────────────────────────────────────────────────────────
  getTodosAdmin(): Observable<Anuncio[]> {
    return this.http.get<Anuncio[]>(`${this.base}/admin/todos`);
  }

  crear(anuncio: Anuncio): Observable<Anuncio> {
    return this.http.post<Anuncio>(this.base, anuncio);
  }

  editar(id: string, anuncio: Anuncio): Observable<Anuncio> {
    return this.http.put<Anuncio>(`${this.base}/${id}`, anuncio);
  }

  cambiarEstado(id: string, activo: boolean): Observable<Anuncio> {
    return this.http.patch<Anuncio>(`${this.base}/${id}/estado`, { activo });
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}