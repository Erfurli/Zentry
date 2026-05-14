import { Component, OnInit, signal, inject, HostListener, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, CompanyRole, SystemRole } from '../../services/auth.service';
import { NotificacionesComponent } from '../../shared/notificaciones/notificaciones.component';

const ESTADOS = [
  { valor: 'activo',     label: 'Activo',          icon: 'fa-solid fa-circle-check',  color: '#10b981' },
  { valor: 'inactivo',   label: 'Inactivo',         icon: 'fa-solid fa-circle',        color: '#94a3b8' },
  { valor: 'vacaciones', label: 'De vacaciones',    icon: 'fa-solid fa-umbrella-beach', color: '#3b82f6' },
  { valor: 'reunion',    label: 'En una reunión',   icon: 'fa-solid fa-briefcase',     color: '#f59e0b' },
  { valor: 'nodisturb',  label: 'No molestar',      icon: 'fa-solid fa-ban',           color: '#ef4444' },
];

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [CommonModule, NotificacionesComponent]
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  systemRole: SystemRole | '' = '';
  companyRole: CompanyRole | '' = '';

  readonly ESTADOS = ESTADOS;
  readonly menuAbierto      = signal(false);
  readonly submenuEstado    = signal(false);
  readonly temaOscuro       = signal(false);
  readonly estadoActual     = signal('activo');

  readonly estadoActualObj = computed(() =>
    ESTADOS.find(e => e.valor === this.estadoActual()) ?? ESTADOS[0]
  );

  get esAdmin(): boolean  { return this.systemRole === 'ADMIN'; }
  get esRRHH(): boolean   { return this.companyRole === 'RRHH'; }

  ngOnInit(): void {
    const temaGuardado = localStorage.getItem('tema-oscuro');
    if (temaGuardado === 'true') {
      this.temaOscuro.set(true);
      document.body.classList.add('tema-oscuro');
    }

    const estadoGuardado = localStorage.getItem('estado-chat');
    if (estadoGuardado) this.estadoActual.set(estadoGuardado);

    this.authService.currentUser$.subscribe(user => {
      this.username    = user?.username ?? '';
      this.systemRole  = user?.systemRole ?? '';
      this.companyRole = user?.companyRole ?? '';
    });
  }

  toggleMenu(): void {
    this.menuAbierto.update(v => !v);
    if (!this.menuAbierto()) this.submenuEstado.set(false);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
    this.submenuEstado.set(false);
  }

  toggleSubmenuEstado(e: MouseEvent): void {
    e.stopPropagation();
    this.submenuEstado.update(v => !v);
  }

  setEstado(valor: string, e: MouseEvent): void {
    e.stopPropagation();
    this.estadoActual.set(valor);
    localStorage.setItem('estado-chat', valor);
    this.submenuEstado.set(false);
  }

  toggleTema(e: MouseEvent): void {
    e.stopPropagation();
    this.temaOscuro.update(v => !v);
    document.body.classList.toggle('tema-oscuro', this.temaOscuro());
    localStorage.setItem('tema-oscuro', String(this.temaOscuro()));
  }

  navegar(ruta: string): void {
    this.router.navigate([ruta]);
    this.cerrarMenu();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('.config-wrapper')) {
      this.cerrarMenu();
    }
  }
}
