import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  loading = false;
  error = '';

  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const { username, password } = this.form.getRawValue();

    this.authService.login({
      username: username!,
      password: password!
    }).subscribe({
      next: (response: LoginResponse) => {
  this.loading = false;
  this.authService.saveSession(response);

        if (response.companyRole === 'RRHH') {
    this.router.navigate(['/admin-dashboard']);
  } else {
    this.router.navigate(['/dashboard']);
  }
},
      error: () => {
        this.loading = false;
        this.error = 'Usuario o contraseña incorrectos.';
      }
    });
  }
}
