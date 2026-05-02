import {
  Component,
  EventEmitter,
  HostBinding,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  AuthService,
  CompanyRole,
  SystemRole,
} from '../../services/auth.service';

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
  get isCollapsed() {
    return this.collapsed();
  }
  @Output() collapsedChange = new EventEmitter<boolean>();

  collapsed = signal(false);

  menuItems: MenuItem[] = [
    { label: 'Inicio', route: '/dashboard', icon: 'fa-chart-bar', systemRoles: ['ADMIN', 'USER'] },
    { label: 'Asistencia', route: '/asistencia', icon: 'fa-users', systemRoles: ['ADMIN', 'USER'] },
    { label: 'Vacaciones', route: '/vacaciones', icon: 'fa-umbrella-beach', systemRoles: ['ADMIN', 'USER'] },
    { label: 'Ausencias', route: '/ausencias', icon: 'fa-calendar-xmark', systemRoles: ['ADMIN', 'USER'] },
    { label: 'Empleados', route: '/empleados', icon: 'fa-user', systemRoles: ['ADMIN'] },
    { label: 'Usuarios', route: '/usuarios', icon: 'fa-user-shield', systemRoles: ['ADMIN'] },
    { label: 'Panel RRHH', route: '/admin-dashboard', icon: 'fa-gauge-high', systemRoles: ['ADMIN'] },
    { label: 'Reportes', route: '/reportes', icon: 'fa-chart-line', systemRoles: ['ADMIN'] },
    { label: 'Chat', route: '/chat', icon: 'fa-comments', systemRoles: ['ADMIN', 'USER'] },
  ];

  constructor(private authService: AuthService) {}

  toggle(): void {
    const nextValue = !this.collapsed();
    this.collapsed.set(nextValue);
    this.collapsedChange.emit(nextValue);
  }

  get visibleMenuItems(): MenuItem[] {
    const systemRole = this.authService.getSystemRole();
    const companyRole = this.authService.getCompanyRole();
    return this.menuItems.filter((item) => {
      const matchesSystemRole = !!systemRole && !!item.systemRoles && item.systemRoles.includes(systemRole);
      const matchesCompanyRole = !!companyRole && !!item.companyRoles && item.companyRoles.includes(companyRole);
      return matchesSystemRole || matchesCompanyRole;
    });
  }

  getIconClass(route: string): string {
    return this.menuItems.find((item) => item.route === route)?.icon ?? 'fa-circle';
  }
}
