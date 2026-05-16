import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment';

type TipoFiltro = 'todos' | 'entrada' | 'salida' | 'vacaciones' | 'ausencia' | 'incidencia';

interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
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
  private http   = inject(HttpClient);

  readonly notificaciones  = signal<Notificacion[]>([]);
  readonly abierto         = signal(false);
  readonly filtroActivo    = signal<TipoFiltro>('todos');
  readonly marcandoTodas   = signal(false);

  readonly FILTROS: { valor: TipoFiltro; label: string; icon: string }[] = [
    { valor: 'todos',       label: 'Todas',      icon: 'fa-bell' },
    { valor: 'vacaciones',  label: 'Vacaciones', icon: 'fa-plane' },
    { valor: 'ausencia',    label: 'Ausencias',  icon: 'fa-user-slash' },
    { valor: 'entrada',     label: 'Entradas',   icon: 'fa-clock' },
    { valor: 'salida',      label: 'Salidas',    icon: 'fa-sign-out-alt' },
    { valor: 'incidencia',  label: 'Incidencias',icon: 'fa-triangle-exclamation' },
  ];

  readonly notificacionesFiltradas = computed(() => {
    const f = this.filtroActivo();
    return f === 'todos'
      ? this.notificaciones()
      : this.notificaciones().filter(n => n.tipo === f);
  });

  readonly noLeidas = computed(() =>
    this.notificacionesFiltradas().filter(n => !n.leida)
  );

  readonly leidas = computed(() =>
    this.notificacionesFiltradas().filter(n => n.leida)
  );

  readonly totalNoLeidas = computed(() =>
    this.notificaciones().filter(n => !n.leida).length
  );

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.http.get<Notificacion[]>(`${environment.apiUrl}/notificaciones`)
      .subscribe({
        next: data => this.notificaciones.set(data),
        error: err  => console.error('Error cargando notificaciones:', err)
      });
  }

  toggleNotifs(): void {
    this.abierto.update(v => !v);
    if (this.abierto()) this.cargarNotificaciones();
  }

  cerrarNotifs(): void { this.abierto.set(false); }

  setFiltro(f: TipoFiltro): void { this.filtroActivo.set(f); }

  irARuta(ruta: string): void {
    this.router.navigate([ruta]);
    this.cerrarNotifs();
  }

  marcarLeida(id: string): void {
    this.http.patch(`${environment.apiUrl}/notificaciones/${id}/leer`, {})
      .subscribe({
        next: () => this.notificaciones.update(ns =>
          ns.map(n => n.id === id ? { ...n, leida: true } : n)
        )
      });
  }

  marcarTodasLeidas(): void {
    this.marcandoTodas.set(true);
    this.http.patch(`${environment.apiUrl}/notificaciones/leer-todas`, {})
      .subscribe({
        next: () => {
          this.notificaciones.update(ns => ns.map(n => ({ ...n, leida: true })));
          this.marcandoTodas.set(false);
        },
        error: () => this.marcandoTodas.set(false)
      });
  }

  formatoFecha(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  }

  getIcono(tipo: string): string {
    const mapa: Record<string, string> = {
      entrada:    'fa-clock',
      salida:     'fa-sign-out-alt',
      vacaciones: 'fa-plane',
      ausencia:   'fa-user-slash',
      incidencia: 'fa-triangle-exclamation',
    };
    return mapa[tipo] ?? 'fa-bell';
  }
}
