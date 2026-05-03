import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../enviroments/enviroment';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cambiar-password.component.html',
  styleUrl: './cambiar-password.component.css'
})
export class CambiarPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  loading = false;
  error = '';
  showPassword = signal(false);
  showConfirm = signal(false);

  readonly form = this.fb.group({
    nuevaPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmarPassword: ['', Validators.required]
  });

  get passwordsNoCoinciden(): boolean {
    const nueva = this.form.get('nuevaPassword')?.value;
    const confirmar = this.form.get('confirmarPassword')?.value;
    return !!nueva && !!confirmar && nueva !== confirmar;
  }

  onSubmit(): void {
    if (this.form.invalid || this.passwordsNoCoinciden) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const empleadoId = this.authService.getEmpleadoId();
    const nuevaPassword = this.form.getRawValue().nuevaPassword!;

    this.http.get<any[]>(`${environment.apiUrl}/usuarios`).subscribe({
      next: usuarios => {
        const usuario = usuarios.find(u => u.empleadoId === empleadoId);
        if (!usuario) {
          this.loading = false;
          this.error = 'No se encontró el usuario.';
          return;
        }

        this.http.patch(`${environment.apiUrl}/usuarios/${usuario.id}/cambiar-password`, {
          password: nuevaPassword
        }).subscribe({
          next: () => {
            this.loading = false;
            const session = this.authService.getCurrentUser();
            if (session) {
              this.authService.saveSession({ ...session, mustChangePassword: false });
            }
            const companyRole = this.authService.getCompanyRole();
            if (companyRole === 'RRHH') {
              this.router.navigate(['/admin-dashboard']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          },
          error: () => {
            this.loading = false;
            this.error = 'No se pudo cambiar la contraseña.';
          }
        });
      },
      error: () => {
        this.loading = false;
        this.error = 'Error al obtener datos del usuario.';
      }
    });
  }
}
