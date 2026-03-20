import { Routes } from '@angular/router';
import { HomeDashboardComponent } from './features/home/home-dashboard/home-dashboard.component';
import { AsistenciaComponent } from './pages/asistencia/asistencia.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { VacacionesComponent } from './pages/vacaciones/vacaciones.component';
import { ReportesComponent } from './pages/reportes/reportes.component';
import { EmpleadosComponent } from './pages/empleados/empleados.component';
import { AusenciasComponent } from './pages/ausencias/ausencias.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: HomeDashboardComponent },
  { path: 'asistencia', component: AsistenciaComponent },
  { path: 'vacaciones', component: VacacionesComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'reportes', component: ReportesComponent },
  { path: 'empleados', component: EmpleadosComponent },
  { path: 'ausencias', component: AusenciasComponent },

  { path: '**', redirectTo: '/dashboard' }
];
