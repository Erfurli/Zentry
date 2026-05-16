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
    if (!this.esAdmin) return;

    this.http.get<{ count: number }>(`${this.API}/ausencias/pendientes/count`)
      .subscribe({ next: r => this.ausenciasPendientes.set(r.count) });

    this.http.get<{ count: number }>(`${this.API}/vacaciones/pendientes/count`)
      .subscribe({ next: r => this.vacacionesPendientes.set(r.count) });

    this.http.get<{ count: number }>(`${this.API}/asistencia/incidencias/count`)
      .subscribe({ next: r => this.incidenciasPendientes.set(r.count) });
  }

  recargarAusencias(): void {
    this.http.get<{ count: number }>(`${this.API}/ausencias/pendientes/count`)
      .subscribe({ next: r => this.ausenciasPendientes.set(r.count) });
  }

  recargarVacaciones(): void {
    this.http.get<{ count: number }>(`${this.API}/vacaciones/pendientes/count`)
      .subscribe({ next: r => this.vacacionesPendientes.set(r.count) });
  }

  recargarIncidencias(): void {
    this.http.get<{ count: number }>(`${this.API}/asistencia/incidencias/count`)
      .subscribe({ next: r => this.incidenciasPendientes.set(r.count) });
  }
}
