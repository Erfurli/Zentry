import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export type CompanyRole = 'EMPLEADO' | 'MANDO' | 'RRHH';
export type SystemRole = 'ADMIN' | 'USER';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  username: string;
  systemRole: SystemRole;
  companyRole: CompanyRole;
  empleadoId: string;
  mustChangePassword: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/auth';

  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(
    this.getStoredSession(),
  );

  currentUser$ = this.currentUserSubject.asObservable();

  getUsuarioActual(): { id: string; nombre: string } | null {
    const user = this.getCurrentUser();
    if (!user) return null;

    return {
      id: user.userId,
      nombre: user.username
    };
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((response) => {
        this.saveSession(response);
      }),
    );
  }

  saveSession(data: LoginResponse): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('username', data.username);
    localStorage.setItem('companyRole', data.companyRole);
    localStorage.setItem('systemRole', data.systemRole);
    localStorage.setItem('empleadoId', String(data.empleadoId));
    localStorage.setItem('mustChangePassword', String(data.mustChangePassword));
    localStorage.setItem('currentUser', JSON.stringify(data));
    this.currentUserSubject.next(data);
  }

  private getStoredSession(): LoginResponse | null {
    const stored = localStorage.getItem('currentUser');
    return stored ? (JSON.parse(stored) as LoginResponse) : null;
  }

  getCurrentUser(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUsername(): string | null {
    return this.getCurrentUser()?.username || localStorage.getItem('username');
  }

  getSystemRole(): SystemRole | null {
    return (
      this.getCurrentUser()?.systemRole ||
      (localStorage.getItem('systemRole') as SystemRole | null)
    );
  }

  getCompanyRole(): CompanyRole | null {
    return (
      this.getCurrentUser()?.companyRole ||
      (localStorage.getItem('companyRole') as CompanyRole | null)
    );
  }

  getEmpleadoId(): string | null {
    return (
      this.getCurrentUser()?.empleadoId ?? localStorage.getItem('empleadoId')
    );
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getSystemRole() === 'ADMIN';
  }

  hasSystemRole(roles: SystemRole[]): boolean {
    const role = this.getSystemRole();
    return !!role && roles.includes(role);
  }

  hasCompanyRole(roles: CompanyRole[]): boolean {
    const role = this.getCompanyRole();
    return !!role && roles.includes(role);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('companyRole');
    localStorage.removeItem('systemRole');
    localStorage.removeItem('empleadoId');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }
}
