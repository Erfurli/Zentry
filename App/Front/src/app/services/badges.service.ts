import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class BadgesService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private API = environment.apiUrl;

  readonly ausenciasPendientes   = signal(0);
  readonly vacacionesPendientes  = signal(0);
  readonly incidenciasPendientes = signal(0);

  get esAdmin(): boolean {
    return this.authService.getSystemRole() === 'ADMIN' ||
           this.authService.getCompanyRole() === 'RRHH';
  }

  cargar(): void {
    this.recargarAusencias();
    this.recargarVacaciones();
    this.recargarIncidencias();
  }

  recargarAusencias(): void {
    const url = this.esAdmin
      ? `${this.API}/ausencias/pendientes/count`
      : `${this.API}/ausencias/mis-ausencias/count`;

    this.http.get<{ count: number }>(url)
      .subscribe({
        next: r => this.ausenciasPendientes.set(r.count),
        error: () => this.ausenciasPendientes.set(0)
      });
  }

  recargarVacaciones(): void {
    const url = this.esAdmin
      ? `${this.API}/vacaciones/pendientes/count`
      : `${this.API}/vacaciones/mis-vacaciones/count`;

    this.http.get<{ count: number }>(url)
      .subscribe({
        next: r => this.vacacionesPendientes.set(r.count),
        error: () => this.vacacionesPendientes.set(0)
      });
  }

  recargarIncidencias(): void {
    if (!this.esAdmin) {
      this.incidenciasPendientes.set(0);
      return;
    }

    this.http.get<{ count: number }>(`${this.API}/asistencia/incidencias/count`)
      .subscribe({
        next: r => this.incidenciasPendientes.set(r.count),
        error: () => this.incidenciasPendientes.set(0)
      });
  }
}
