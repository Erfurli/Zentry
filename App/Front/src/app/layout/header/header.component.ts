import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, CompanyRole, SystemRole } from '../../services/auth.service';
import { NotificacionesComponent } from '../../shared/notificaciones/notificaciones.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [NotificacionesComponent]
})
export class HeaderComponent implements OnInit {
  username = '';
  systemRole: SystemRole | '' = '';
  companyRole: CompanyRole | '' = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.username = user?.username ?? '';
      this.systemRole = user?.systemRole ?? '';
      this.companyRole = user?.companyRole ?? '';
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
