import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  loading = false;
  error = '';
  showPassword = false;

  modalRecuperacionAbierto = false;
  emailRecuperacion = '';
  loadingRecuperacion = false;
  errorRecuperacion = '';
  emailEnviado = false;

  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const { username, password } = this.form.getRawValue();

    this.authService
      .login({
        username: username!,
        password: password!,
      })
      .subscribe({
        next: (response: LoginResponse) => {
          this.loading = false;
          this.authService.saveSession(response);

          if (response.mustChangePassword) {
            this.router.navigate(['/cambiar-password']);
          } else if (response.companyRole === 'RRHH') {
            this.router.navigate(['/admin-dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: () => {
          this.loading = false;
          this.error = 'Usuario o contraseña incorrectos.';
        },
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  abrirRecuperacion(): void {
    this.modalRecuperacionAbierto = true;
    this.emailRecuperacion = '';
    this.errorRecuperacion = '';
    this.emailEnviado = false;
  }

  cerrarRecuperacion(): void {
    this.modalRecuperacionAbierto = false;
  }

  enviarRecuperacion(): void {
    if (!this.emailRecuperacion) {
      this.errorRecuperacion = 'Introduce tu email.';
      return;
    }
    this.loadingRecuperacion = true;
    this.errorRecuperacion = '';

    this.http.post(`${environment.apiUrl}/auth/recuperar-password`, {
      email: this.emailRecuperacion
    }).subscribe({
      next: () => {
        this.loadingRecuperacion = false;
        this.emailEnviado = true;
      },
      error: () => {
        this.loadingRecuperacion = false;
        this.errorRecuperacion = 'Error al enviar el correo. Inténtalo de nuevo.';
      }
    });
  }
}
