import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeDashboardComponent } from './features/home/home-dashboard/home-dashboard.component';
import { AsistenciaComponent } from './pages/asistencia/asistencia.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { VacacionesComponent } from './pages/vacaciones/vacaciones.component';
import { ReportesComponent } from './pages/reportes/reportes.component';
import { EmpleadosComponent } from './pages/empleados/empleados.component';
import { AusenciasComponent } from './pages/ausencias/ausencias.component';
import { authGuard } from './guards/auth.guard';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { CambiarPasswordComponent } from './pages/cambiar-password/cambiar-password.component';
import { ResetearPasswordComponent } from './pages/resetear-password/resetear-password.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'cambiar-password',
    component: CambiarPasswordComponent,
  },
  {
    path: 'resetear-password',
    component: ResetearPasswordComponent,
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: HomeDashboardComponent,
        canActivate: [authGuard],
        data: { roles: ['EMPLEADO', 'MANDO', 'RRHH'] },
      },
      {
        path: 'asistencia',
        component: AsistenciaComponent,
        canActivate: [authGuard],
        data: { roles: ['EMPLEADO', 'MANDO', 'RRHH'] },
      },
      {
        path: 'vacaciones',
        component: VacacionesComponent,
        canActivate: [authGuard],
        data: { roles: ['EMPLEADO', 'MANDO', 'RRHH'] },
      },
      {
        path: 'ausencias',
        component: AusenciasComponent,
        canActivate: [authGuard],
        data: { roles: ['EMPLEADO', 'MANDO', 'RRHH'] },
      },
      {
        path: 'admin-dashboard',
        component: AdminDashboardComponent,
        canActivate: [authGuard],
        data: { roles: ['RRHH'] },
      },
      {
        path: 'reportes',
        component: ReportesComponent,
        canActivate: [authGuard],
        data: { roles: ['RRHH'] },
      },
      {
        path: 'empleados',
        component: EmpleadosComponent,
        canActivate: [authGuard],
        data: { roles: ['RRHH', 'MANDO'] },
      },
      {
        path: 'usuarios',
        component: UsuariosComponent,
        canActivate: [authGuard],
        data: { roles: ['RRHH'] },
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
