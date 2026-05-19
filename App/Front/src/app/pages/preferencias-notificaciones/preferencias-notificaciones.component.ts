import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment';

interface PreferenciaNotif {
  tipo: string;
  label: string;
  descripcion: string;
  icon: string;
  inApp: boolean;
  email: boolean;
}

@Component({
  selector: 'preferencias-notificaciones',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './preferencias-notificaciones.component.html',
  styleUrl: './preferencias-notificaciones.component.css'
})
export class PreferenciasNotificacionesComponent implements OnInit {
  private http = inject(HttpClient);

  readonly guardando = signal(false);
  readonly guardado  = signal(false);

  readonly preferencias = signal<PreferenciaNotif[]>([
    {
      tipo: 'vacaciones',
      label: 'Vacaciones',
      descripcion: 'Aprobación, rechazo o cambios en tus solicitudes de vacaciones',
      icon: 'fa-solid fa-umbrella-beach',
      inApp: true,
      email: true,
    },
    {
      tipo: 'ausencias',
      label: 'Ausencias',
      descripcion: 'Cambios de estado en tus solicitudes de ausencia',
      icon: 'fa-solid fa-calendar-xmark',
      inApp: true,
      email: false,
    },
    {
      tipo: 'fichaje',
      label: 'Fichajes',
      descripcion: 'Incidencias de fichaje aprobadas o rechazadas',
      icon: 'fa-solid fa-clock',
      inApp: true,
      email: false,
    },
    {
      tipo: 'chat',
      label: 'Mensajes de chat',
      descripcion: 'Nuevos mensajes en conversaciones donde participas',
      icon: 'fa-solid fa-comments',
      inApp: true,
      email: false,
    },
    {
      tipo: 'sistema',
      label: 'Sistema',
      descripcion: 'Avisos generales del sistema y actualizaciones',
      icon: 'fa-solid fa-bell',
      inApp: true,
      email: true,
    },
  ]);

  ngOnInit(): void {
    this.http.get<Record<string, { inApp: boolean; email: boolean }>>(
      `${environment.apiUrl}/notificaciones/preferencias`
    ).subscribe({
      next: data => {
        this.preferencias.update(prefs =>
          prefs.map(p => ({
            ...p,
            inApp: data[p.tipo]?.inApp ?? p.inApp,
            email: data[p.tipo]?.email ?? p.email,
          }))
        );
      },
      error: () => {}
    });
  }

  toggleInApp(tipo: string): void {
    this.preferencias.update(prefs =>
      prefs.map(p => p.tipo === tipo ? { ...p, inApp: !p.inApp } : p)
    );
  }

  toggleEmail(tipo: string): void {
    this.preferencias.update(prefs =>
      prefs.map(p => p.tipo === tipo ? { ...p, email: !p.email } : p)
    );
  }

  guardar(): void {
    this.guardando.set(true);
    const payload: Record<string, { inApp: boolean; email: boolean }> = {};
    this.preferencias().forEach(p => {
      payload[p.tipo] = { inApp: p.inApp, email: p.email };
    });

    this.http.put(`${environment.apiUrl}/notificaciones/preferencias`, payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.guardado.set(true);
        setTimeout(() => this.guardado.set(false), 3000);
      },
      error: () => this.guardando.set(false)
    });
  }
}
