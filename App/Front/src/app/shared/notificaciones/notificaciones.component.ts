import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment';

interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'entrada' | 'salida' | 'vacaciones' | 'ausencia';
  leida: boolean;
  ruta?: string;
  fecha: string;
}

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.css',
})
export class NotificacionesComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);

  readonly notificaciones = signal<Notificacion[]>([]);
  readonly abierto = signal(false);
  readonly noLeidas = computed(() => this.notificaciones().filter(n => !n.leida));
  readonly leidas = computed(() => this.notificaciones().filter(n => n.leida));

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.http.get<Notificacion[]>(`${environment.apiUrl}/notificaciones`)
      .subscribe({
        next: (data) => this.notificaciones.set(data),
        error: (err) => console.error('Error cargando notificaciones:', err)
      });
  }

  toggleNotifs(): void {
    this.abierto.update(v => !v);
    if (this.abierto()) {
      this.cargarNotificaciones();
    }
  }

  cerrarNotifs(): void {
    this.abierto.set(false);
  }

  irARuta(ruta: string): void {
    this.router.navigate([ruta]);
    this.cerrarNotifs();
  }

  marcarLeida(id: string): void {
    this.http.patch(`${environment.apiUrl}/notificaciones/${id}/leer`, {})
      .subscribe({
        next: () => {
          this.notificaciones.update(notifs =>
            notifs.map(n => n.id === id ? { ...n, leida: true } : n)
          );
        },
        error: (err) => console.error('Error marcando notificación:', err)
      });
  }

  formatoFecha(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}
