import { Component } from '@angular/core';
imports: [CommonModule, RouterLink, NotificacionesComponent];  // ← AÑADIR
import { NotificacionesComponent } from '../../shared/notificaciones/notificaciones.component';  // ← AÑADIR
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-header',
  imports: [NotificacionesComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

}
