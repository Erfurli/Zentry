import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: 'entrada' | 'salida' | 'vacaciones' | 'ausencia';
  leida: boolean;
  ruta?: string;
  fecha: Date;
}

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.css',
})
export class NotificacionesComponent {
  readonly notificaciones = signal<Notificacion[]>([
    { id: 1, titulo: 'Nueva entrada', mensaje: 'Ana López ha fichado entrada', tipo: 'entrada', leida: false, fecha: new Date('2026-03-20T09:00:00'), ruta: '/asistencia' },
    { id: 2, titulo: 'Solicitud vacaciones', mensaje: 'Carlos García solicita 10 días', tipo: 'vacaciones', leida: false, fecha: new Date('2026-03-20T10:15:00'), ruta: '/vacaciones' },
    { id: 3, titulo: 'Salida registrada', mensaje: 'María Pérez ha fichado salida', tipo: 'salida', leida: true, fecha: new Date('2026-03-20T18:30:00') },
    { id: 4, titulo: 'Ausencia justificada', mensaje: 'Juan Martínez ausencia médica', tipo: 'ausencia', leida: false, fecha: new Date('2026-03-20T14:20:00'), ruta: '/ausencias' },
  ]);

  constructor(private router: Router) {}
  irARuta(ruta: string): void {
    this.router.navigate([ruta]);  // ← USA ROUTER
    this.cerrarNotifs();
  }

  readonly abierto = signal(false);
  readonly noLeidas = computed(() => this.notificaciones().filter(n => !n.leida));
  readonly leidas = computed(() => this.notificaciones().filter(n => n.leida));

  toggleNotifs(): void {
    this.abierto.update(v => !v);
  }

  cerrarNotifs(): void {
    this.abierto.set(false);
  }

  marcarLeida(id: number): void {
    this.notificaciones.update(notifs =>
      notifs.map(n => n.id === id ? { ...n, leida: true } : n)
    );
  }


  formatoFecha(fecha: Date): string {
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}
