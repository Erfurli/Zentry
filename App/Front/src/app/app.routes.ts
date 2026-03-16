import { Routes } from '@angular/router';
import { HomeDashboardComponent } from './features/home/home-dashboard/home-dashboard.component';
import { AsistenciaComponent } from './pages/asistencia/asistencia.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: HomeDashboardComponent },
  { path: 'asistencia', component: AsistenciaComponent },  // ← NUEVA
  { path: 'admin-dashboard', component: AdminDashboardComponent },

  { path: '**', redirectTo: '/dashboard' }
];
