import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment';

@Component({
  selector: 'app-resetear-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resetear-password.component.html',
  styleUrl: './resetear-password.component.css'
})
export class ResetearPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  token = '';
  loading = false;
  error = '';
  exito = false;
  tokenInvalido = false;
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

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.tokenInvalido = true;
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.passwordsNoCoinciden) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    this.http.post(`${environment.apiUrl}/auth/resetear-password`, {
      token: this.token,
      password: this.form.getRawValue().nuevaPassword
    }).subscribe({
      next: () => {
        this.loading = false;
        this.exito = true;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error ?? 'Error al restablecer la contraseña.';
      }
    });
  }
}
