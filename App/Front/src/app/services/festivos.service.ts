import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../enviroments/enviroment';

export interface Festivo {
  fecha: string;
  nombre: string;
  tipo: 'NACIONAL' | 'COMUNIDAD';
}

@Injectable({ providedIn: 'root' })
export class FestivosService {
  private http = inject(HttpClient);

  getFestivos(year: number): Observable<Festivo[]> {
    return this.http.get<Festivo[]>(`${environment.apiUrl}/festivos/${year}`)
      .pipe(catchError(() => of([])));
  }

  esFestivo(fecha: Date, festivos: Festivo[]): boolean {
    const str = fecha.toISOString().split('T')[0];
    return festivos.some(f => f.fecha === str);
  }

  getNombreFestivo(fecha: Date, festivos: Festivo[]): string | null {
    const str = fecha.toISOString().split('T')[0];
    return festivos.find(f => f.fecha === str)?.nombre ?? null;
  }
}
