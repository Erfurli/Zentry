import {
  Component,
  EventEmitter,
  HostBinding,
  inject,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, CompanyRole, SystemRole } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  companyRoles?: CompanyRole[];
  systemRoles?: SystemRole[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @HostBinding('class.collapsed')
  get isCollapsed() { return this.collapsed(); }

  @Output() collapsedChange = new EventEmitter<boolean>();

  collapsed = signal(false);

  private authService = inject(AuthService);
  private chatService = inject(ChatService);

  readonly chatNoLeidas = this.chatService.noLeidasGlobal;

  menuItems: MenuItem[] = [
    { label: 'Inicio',      route: '/dashboard',       icon: 'fa-chart-bar',      systemRoles: ['ADMIN', 'USER'] },
    { label: 'Asistencia',  route: '/asistencia',      icon: 'fa-users',           systemRoles: ['ADMIN', 'USER'] },
    { label: 'Vacaciones',  route: '/vacaciones',      icon: 'fa-umbrella-beach',  systemRoles: ['ADMIN', 'USER'] },
    { label: 'Ausencias',   route: '/ausencias',       icon: 'fa-calendar-xmark',  systemRoles: ['ADMIN', 'USER'] },
    { label: 'Empleados',   route: '/empleados',       icon: 'fa-user',            systemRoles: ['ADMIN'] },
    { label: 'Usuarios',    route: '/usuarios',        icon: 'fa-user-shield',     systemRoles: ['ADMIN'] },
    { label: 'Panel RRHH',  route: '/admin-dashboard', icon: 'fa-gauge-high',      systemRoles: ['ADMIN'] },
    { label: 'Reportes',    route: '/reportes',        icon: 'fa-chart-line',      systemRoles: ['ADMIN'] },
    { label: 'Chat',        route: '/chat',            icon: 'fa-comments',        systemRoles: ['ADMIN', 'USER'] },
  ];

  toggle(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    this.collapsedChange.emit(next);
  }

  get visibleMenuItems(): MenuItem[] {
    const systemRole = this.authService.getSystemRole();
    const companyRole = this.authService.getCompanyRole();
    return this.menuItems.filter(item => {
      const matchSystem  = !!systemRole  && !!item.systemRoles  && item.systemRoles.includes(systemRole);
      const matchCompany = !!companyRole && !!item.companyRoles && item.companyRoles.includes(companyRole);
      return matchSystem || matchCompany;
    });
  }

  getIconClass(route: string): string {
    return this.menuItems.find(item => item.route === route)?.icon ?? 'fa-circle';
  }
}
