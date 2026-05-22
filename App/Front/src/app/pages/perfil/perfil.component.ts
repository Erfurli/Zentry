import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { VacacionesService, VacacionesVista } from '../../services/vacaciones.service';
import { FestivosService, Festivo } from '../../services/festivos.service';
import { ChatService } from '../../services/chat.service';
import { environment } from '../../../enviroments/enviroment';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  private authService     = inject(AuthService);
  private http            = inject(HttpClient);
  private vacService      = inject(VacacionesService);
  private festivosService = inject(FestivosService);
  private chatService     = inject(ChatService);
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);

  readonly empleado        = signal<any>(null);
  readonly usuarioAjeno    = signal<any>(null);
  readonly vacaciones      = signal<VacacionesVista[]>([]);
  readonly festivos        = signal<Festivo[]>([]);
  readonly mesActual       = signal(new Date());
  readonly fotoPreview     = signal<string | null>(null);
  readonly cargandoFoto    = signal(false);
  readonly abriendo        = signal(false);

  readonly esPropioEmpleadoId = this.authService.getEmpleadoId();
  readonly empleadoIdVisto    = signal<string | null>(null);
  readonly esPropioP          = computed(() =>
    this.empleadoIdVisto() === null ||
    this.empleadoIdVisto() === this.esPropioEmpleadoId
  );

  readonly esAdmin = computed(() => this.authService.isAdmin());

  readonly puedeVerInfo = computed(() => this.esAdmin() || this.esPropioP());

  readonly diasAprobados  = computed(() =>
    this.vacaciones().filter(v => v.estado === 'Aprobada').reduce((a, v) => a + v.dias, 0)
  );
  readonly diasPendientes = computed(() =>
    this.vacaciones().filter(v => v.estado === 'Pendiente').reduce((a, v) => a + v.dias, 0)
  );

  readonly diasEnMes = computed(() => {
    const mes  = this.mesActual();
    const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    return Array.from({ length: total }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1));
  });

  readonly primerDiaSemana = computed(() => {
    const d = new Date(this.mesActual().getFullYear(), this.mesActual().getMonth(), 1);
    return (d.getDay() + 6) % 7;
  });

  ngOnInit(): void {
    const empleadoIdParam = this.route.snapshot.queryParamMap.get('empleadoId');
    const miEmpleadoId    = this.esPropioEmpleadoId;
    const empleadoId      = empleadoIdParam ?? miEmpleadoId;

    this.empleadoIdVisto.set(empleadoIdParam);

    if (empleadoId) {
      this.http.get<any>(`${environment.apiUrl}/empleados/${empleadoId}`).subscribe({
        next: emp => {
          this.empleado.set(emp);
          if (emp.foto) this.fotoPreview.set(emp.foto);
        }
      });
    }

    if (this.esPropioP() || this.esAdmin()) {
      if (empleadoIdParam && this.esAdmin()) {
        this.http.get<VacacionesVista[]>(
          `${environment.apiUrl}/vacaciones/empleado/${empleadoIdParam}`
        ).subscribe({ next: v => this.vacaciones.set(v), error: () => {} });
      } else {
        this.vacService.getMisVacaciones().subscribe({
          next: vacs => this.vacaciones.set(vacs)
        });
      }
    }

    this.cargarFestivos();
  }

  abrirChat(): void {
    const emp = this.empleado();
    if (!emp) return;
    this.abriendo.set(true);

    this.http.get<any>(`${environment.apiUrl}/usuarios/por-empleado/${emp.id}`).subscribe({
      next: usuario => {
        this.chatService.abrirIndividual(usuario.id).subscribe({
          next: conv => {
            this.abriendo.set(false);
            this.router.navigate(['/chat'], { queryParams: { conv: conv.id } });
          },
          error: () => this.abriendo.set(false)
        });
      },
      error: () => this.abriendo.set(false)
    });
  }

  cargarFestivos(): void {
    this.festivosService.getFestivos(this.mesActual().getFullYear()).subscribe({
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
    if (this.festivosService.esFestivo(dia, this.festivos())) clases.push('dia-festivo');

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
    if (!this.esPropioP()) return; // solo puede cambiar la suya
    const file = (event.target as HTMLInputElement).files?.[0];
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
    const empleadoId = this.esPropioEmpleadoId;
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
