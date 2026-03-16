import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AdminLayoutComponent],
  template: `<app-admin-layout><router-outlet></router-outlet></app-admin-layout>`
})
export class AppComponent {}
