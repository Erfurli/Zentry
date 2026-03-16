import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';     // ← CORRECTO
import { SidebarComponent } from '../sidebar/sidebar.component';  // ← CORRECTO

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,    // ← NOMBRE REAL
    SidebarComponent    // ← NOMBRE REAL
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent { }
