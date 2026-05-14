import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { VacacionesService, VacacionesVista } from '../../services/vacaciones.service';
import { FestivosService, Festivo } from '../../services/festivos.service';
import { environment } from '../../../enviroments/enviroment';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  private authService  = inject(AuthService);
  private http         = inject(HttpClient);
  private vacService   = inject(VacacionesService);
  private festivosService = inject(FestivosService);

  readonly empleado        = signal<any>(null);
  readonly vacaciones      = signal<VacacionesVista[]>([]);
  readonly festivos        = signal<Festivo[]>([]);
  readonly mesActual       = signal(new Date());
  readonly fotoPreview     = signal<string | null>(null);
  readonly cargandoFoto    = signal(false);

  readonly diasAprobados = computed(() =>
    this.vacaciones().filter(v => v.estado === 'Aprobada').reduce((a, v) => a + v.dias, 0)
  );
  readonly diasPendientes = computed(() =>
    this.vacaciones().filter(v => v.estado === 'Pendiente').reduce((a, v) => a + v.dias, 0)
  );

  readonly diasEnMes = computed(() => {
    const mes = this.mesActual();
    const anio = mes.getFullYear();
    const m = mes.getMonth();
    const total = new Date(anio, m + 1, 0).getDate();
    return Array.from({ length: total }, (_, i) => new Date(anio, m, i + 1));
  });

  readonly primerDiaSemana = computed(() => {
    const d = new Date(this.mesActual().getFullYear(), this.mesActual().getMonth(), 1);
    return (d.getDay() + 6) % 7; // lunes = 0
  });

  ngOnInit(): void {
    const empleadoId = this.authService.getEmpleadoId();
    if (empleadoId) {
      this.http.get<any>(`${environment.apiUrl}/empleados/${empleadoId}`).subscribe({
        next: emp => {
          this.empleado.set(emp);
          if (emp.foto) this.fotoPreview.set(emp.foto);
        }
      });
    }

    this.vacService.getMisVacaciones().subscribe({
      next: vacs => this.vacaciones.set(vacs)
    });

    this.cargarFestivos();
  }

  cargarFestivos(): void {
    const year = this.mesActual().getFullYear();
    this.festivosService.getFestivos(year).subscribe({
      next: f => this.festivos.set(f)
    });
  }

  mesAnterior(): void {
    const d = this.mesActual();
    this.mesActual.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    this.cargarFestivos();
  }

  mesSiguiente(): void {
    const d = this.mesActual();
    this.mesActual.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    this.cargarFestivos();
  }

  getNombreMes(): string {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const d = this.mesActual();
    return `${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  getClaseDia(dia: Date): string {
    const clases: string[] = [];
    const str = dia.toISOString().split('T')[0];

    if (this.festivosService.esFestivo(dia, this.festivos())) {
      clases.push('dia-festivo');
    }

    const vac = this.vacaciones().find(v => {
      const ini = new Date(v.fechaInicio); ini.setHours(0,0,0,0);
      const fin = new Date(v.fechaFin);   fin.setHours(23,59,59,999);
      return dia >= ini && dia <= fin;
    });

    if (vac) {
      if (vac.estado === 'Aprobada')  clases.push('dia-aprobada');
      if (vac.estado === 'Pendiente') clases.push('dia-pendiente');
      if (vac.estado === 'Rechazada') clases.push('dia-rechazada');
    }

    const hoy = new Date(); hoy.setHours(0,0,0,0);
    if (dia.getTime() === hoy.getTime()) clases.push('dia-hoy');

    if (dia.getDay() === 0 || dia.getDay() === 6) clases.push('dia-finde');

    return clases.join(' ');
  }

  getTooltipDia(dia: Date): string {
    const festivo = this.festivosService.getNombreFestivo(dia, this.festivos());
    if (festivo) return festivo;
    const vac = this.vacaciones().find(v => {
      const ini = new Date(v.fechaInicio); ini.setHours(0,0,0,0);
      const fin = new Date(v.fechaFin);   fin.setHours(23,59,59,999);
      return dia >= ini && dia <= fin;
    });
    if (vac) return `Vacaciones ${vac.estado.toLowerCase()}`;
    return '';
  }

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.fotoPreview.set(base64);
      this.guardarFoto(base64);
    };
    reader.readAsDataURL(file);
  }

  private guardarFoto(base64: string): void {
    const empleadoId = this.authService.getEmpleadoId();
    if (!empleadoId) return;
    this.cargandoFoto.set(true);
    this.http.patch(`${environment.apiUrl}/empleados/${empleadoId}/foto`, { foto: base64 }).subscribe({
      next: () => this.cargandoFoto.set(false),
      error: () => this.cargandoFoto.set(false)
    });
  }

  getIniciales(): string {
    const nombre = this.empleado()?.nombre ?? this.authService.getUsername() ?? '';
    const partes = nombre.trim().split(' ');
    return partes.length >= 2
      ? (partes[0][0] + partes[1][0]).toUpperCase()
      : nombre.substring(0, 2).toUpperCase();
  }
}
