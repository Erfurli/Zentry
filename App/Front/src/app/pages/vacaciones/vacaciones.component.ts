import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCalendarCellClassFunction, MatDatepickerModule, MatCalendar } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { VacacionesService, VacacionesVista } from '../../services/vacaciones.service';
import { AuthService } from '../../services/auth.service';
import { ExportService } from '../../services/export.service';
import { FestivosService, Festivo } from '../../services/festivos.service';
import { BadgesService } from '../../services/badges.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment';

type EstadoSolicitud = 'Aprobada' | 'Pendiente' | 'Rechazada';

@Component({
  selector: 'app-vacaciones',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatDatepickerModule, MatNativeDateModule, MatCardModule, DragDropModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './vacaciones.component.html',
  styleUrl: './vacaciones.component.css'
})
export class VacacionesComponent implements OnInit, AfterViewInit {
  private vacacionesService = inject(VacacionesService);
  private authService       = inject(AuthService);
  private exportService     = inject(ExportService);
  private festivosService   = inject(FestivosService);
  private badgesService     = inject(BadgesService);
  private http              = inject(HttpClient);

  @ViewChild('cal') calendar!: MatCalendar<Date>;

  readonly isEmpleado: boolean = this.authService.getCompanyRole() === 'EMPLEADO';

  readonly festivos             = signal<Festivo[]>([]);
  readonly solicitudes          = signal<VacacionesVista[]>([]);
  readonly filtroEstado         = signal<EstadoSolicitud | 'Todos'>('Todos');
  readonly filtroDepartamento   = signal<string>('Todos');
  readonly filtroNombre         = signal<string>('');
  readonly vistaCalendario      = signal(this.isEmpleado);
  readonly mesActual            = signal(new Date());
  readonly saldo                = signal<{ total: number; usados: number; disponible: number } | null>(null);
  readonly modalSugerenciaAbierto = signal(false);
  readonly solicitudArrastrada    = signal<VacacionesVista | null>(null);
  readonly modalSolicitarAbierto  = signal(false);

  nuevaFechaInicio  = '';
  nuevaFechaFin     = '';
  mensajeSugerencia = '';
  loadingSugerencia = false;
  errorSugerencia   = '';
  fechaSolicitudInicio = '';
  fechaSolicitudFin    = '';
  errorSolicitud       = '';
  loadingSolicitud     = false;

  readonly esAdmin = computed(() => this.authService.getSystemRole() === 'ADMIN');

  readonly solicitudesFiltradas = computed(() => {
    const estado = this.filtroEstado();
    const depto  = this.filtroDepartamento();
    const nom    = this.filtroNombre().trim().toLowerCase();
    return this.solicitudes().filter(s => {
      const coincideEstado  = estado === 'Todos' || s.estado === estado;
      const coincideDepto   = depto  === 'Todos' || s.departamento === depto;
      const coincideNombre  = !nom || s.empleado.toLowerCase().includes(nom);
      return coincideEstado && coincideDepto && coincideNombre;
    });
  });

  readonly solicitudesDelMes = computed(() => {
  const mesSeleccionado = this.mesActual();
  const anioFiltro = mesSeleccionado.getFullYear();
  const mesFiltro = mesSeleccionado.getMonth();

  return this.solicitudesFiltradas().filter(s => {
    const inicio = new Date(s.fechaInicio + 'T00:00:00');
    const fin = new Date(s.fechaFin + 'T00:00:00');

    const primerDiaMes = new Date(anioFiltro, mesFiltro, 1, 0, 0, 0);
    const ultimoDiaMes = new Date(anioFiltro, mesFiltro + 1, 0, 23, 59, 59);

    return inicio <= ultimoDiaMes && fin >= primerDiaMes;
  });
});

  readonly totalAprobadas       = computed(() => this.solicitudes().filter(s => s.estado === 'Aprobada').length);
  readonly totalPendientes      = computed(() => this.solicitudes().filter(s => s.estado === 'Pendiente').length);
  readonly totalRechazadas      = computed(() => this.solicitudes().filter(s => s.estado === 'Rechazada').length);
  readonly totalDiasSolicitados = computed(() => this.solicitudes().reduce((acc, s) => acc + s.dias, 0));

  ngOnInit(): void {
    this.badgesService.recargarVacaciones();
    this.cargarVacaciones();
    this.cargarFestivos(new Date().getFullYear());
    this.cargarSaldo();
  }

  ngAfterViewInit(): void {
    if (!this.calendar) return;
    this.calendar.stateChanges.subscribe(() => {
      const active = this.calendar.activeDate;
      if (active.getMonth() !== this.mesActual().getMonth() ||
          active.getFullYear() !== this.mesActual().getFullYear()) {
        this.mesActual.set(new Date(active.getFullYear(), active.getMonth(), 1));
        this.cargarFestivos(active.getFullYear());
      }
    });
  }

  cargarSaldo(): void {
    this.http.get<{ total: number; usados: number; disponible: number }>(
      `${environment.apiUrl}/vacaciones/saldo`
    ).subscribe({ next: s => this.saldo.set(s) });
  }

  cargarFestivos(year: number): void {
    this.festivosService.getFestivos(year).subscribe({
      next: f => {
        this.festivos.set(f);
        if (this.calendar) this.calendar.updateTodaysDate();
      }
    });
  }

  activarVistaCalendario(): void {
    this.vistaCalendario.set(true);
    setTimeout(() => {
      if (this.calendar) {
        this.calendar.stateChanges.subscribe(() => {
          const active = this.calendar.activeDate;
          if (active.getMonth() !== this.mesActual().getMonth() ||
              active.getFullYear() !== this.mesActual().getFullYear()) {
            this.mesActual.set(new Date(active.getFullYear(), active.getMonth(), 1));
            this.cargarFestivos(active.getFullYear());
          }
        });
      }
    }, 0);
  }

  cargarVacaciones(): void {
  const peticion = this.isEmpleado
    ? this.vacacionesService.getMisVacaciones()
    : this.vacacionesService.getVacacionesVista();

  peticion.subscribe({
    next: data => {
      this.solicitudes.set(data);
      setTimeout(() => {
        if (this.calendar) this.calendar.updateTodaysDate();
      }, 0);
    },
    error: err => console.error('Error cargando vacaciones', err)
  });
}

  getNombreMes(): string {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const d = this.mesActual();
    return `${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  onDateSelected(date: Date | null): void {
    if (date) this.mesActual.set(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor as EstadoSolicitud | 'Todos');
  }

  cambiarFiltroDepartamento(valor: string): void {
    this.filtroDepartamento.set(valor);
  }

  cambiarFiltroNombre(valor: string): void {
    this.filtroNombre.set(valor);
  }

  aprobar(id: string): void {
    this.vacacionesService.aprobar(id).subscribe({ next: () => this.cargarVacaciones() });
  }

  rechazar(id: string): void {
    this.vacacionesService.rechazar(id).subscribe({ next: () => this.cargarVacaciones() });
  }

  exportar(): void {
    this.exportService.exportarVacacionesExcel(
      this.solicitudesFiltradas(),
      this.isEmpleado ? 'Mis vacaciones' : 'Todas las vacaciones'
    );
  }

  abrirModalSolicitar(): void {
    this.fechaSolicitudInicio = '';
    this.fechaSolicitudFin    = '';
    this.errorSolicitud       = '';
    this.modalSolicitarAbierto.set(true);
  }

  confirmarSolicitud(): void {
    if (!this.fechaSolicitudInicio || !this.fechaSolicitudFin) {
      this.errorSolicitud = 'Introduce las fechas.';
      return;
    }
    if (this.fechaSolicitudFin < this.fechaSolicitudInicio) {
      this.errorSolicitud = 'La fecha fin no puede ser anterior a la fecha inicio.';
      return;
    }
    this.loadingSolicitud = true;
    this.vacacionesService.solicitarVacaciones(
      this.fechaSolicitudInicio,
      this.fechaSolicitudFin
    ).subscribe({
      next: () => {
        this.loadingSolicitud = false;
        this.modalSolicitarAbierto.set(false);
        this.cargarVacaciones();
        this.cargarSaldo();
      },
      error: (err) => {
        this.loadingSolicitud = false;
        this.errorSolicitud = err.error?.error ?? 'No se pudo crear la solicitud.';
      }
    });
  }

  onDragStarted(solicitud: VacacionesVista): void {
  this.solicitudArrastrada.set(solicitud);
}

onDropped(event: CdkDragDrop<VacacionesVista[]>): void {
  const drop = event.dropPoint;
  const elems = document.elementsFromPoint(drop.x, drop.y);
  const celda = elems.find(el => el.classList.contains('mat-calendar-body-cell'));

  if (celda) {
    const label = celda.getAttribute('aria-label');
    if (label) {
      const fechaMatch = celda.querySelector('.mat-calendar-body-cell-content')?.textContent?.trim();
      if (fechaMatch) {
        const mes  = this.mesActual();
        const dia  = parseInt(fechaMatch, 10);
        const fecha = new Date(mes.getFullYear(), mes.getMonth(), dia);
        const iso   = fecha.toISOString().split('T')[0];

        const s = this.solicitudArrastrada();
        if (!s) return;

        const duracion = new Date(s.fechaFin).getTime() - new Date(s.fechaInicio).getTime();
        const finDate  = new Date(fecha.getTime() + duracion);
        const isoFin   = finDate.toISOString().split('T')[0];

        this.nuevaFechaInicio  = iso;
        this.nuevaFechaFin     = isoFin;
        this.mensajeSugerencia = '';
        this.errorSugerencia   = '';
        this.modalSugerenciaAbierto.set(true);
        return;
      }
    }
  }

  const s = this.solicitudArrastrada();
  if (!s) return;
  this.nuevaFechaInicio  = s.fechaInicio;
  this.nuevaFechaFin     = s.fechaFin;
  this.mensajeSugerencia = '';
  this.errorSugerencia   = '';
  this.modalSugerenciaAbierto.set(true);
}

  cerrarModalSugerencia(): void {
    this.modalSugerenciaAbierto.set(false);
    this.solicitudArrastrada.set(null);
    this.nuevaFechaInicio  = '';
    this.nuevaFechaFin     = '';
    this.mensajeSugerencia = '';
    this.errorSugerencia   = '';
  }

  confirmarSugerencia(): void {
    const s = this.solicitudArrastrada();
    if (!s || !this.nuevaFechaInicio || !this.nuevaFechaFin) {
      this.errorSugerencia = 'Introduce las fechas nuevas.';
      return;
    }
    if (this.nuevaFechaFin < this.nuevaFechaInicio) {
      this.errorSugerencia = 'La fecha fin no puede ser anterior a la fecha inicio.';
      return;
    }
    this.loadingSugerencia = true;
    this.vacacionesService.crearSugerencia(
      s.id, this.nuevaFechaInicio, this.nuevaFechaFin, this.mensajeSugerencia
    ).subscribe({
      next: () => {
        this.loadingSugerencia = false;
        this.cerrarModalSugerencia();
      },
      error: () => {
        this.loadingSugerencia = false;
        this.errorSugerencia = 'No se pudo enviar la sugerencia.';
      }
    });
  }

  puedeArrastrar(solicitud: VacacionesVista): boolean {
    if (this.authService.getSystemRole() === 'ADMIN') return true;
    const empleadoId = this.authService.getEmpleadoId();
    return solicitud.estado === 'Pendiente' &&
           solicitud.empleadoId === String(empleadoId);
  }

  dateClass: MatCalendarCellClassFunction<Date> = (date) => {
    if (this.festivosService.esFestivo(date, this.festivos())) return 'dia-festivo';
    for (const s of this.solicitudesFiltradas()) {
      const inicio = new Date(s.fechaInicio + 'T00:00:00');
const fin = new Date(s.fechaFin + 'T00:00:00');
      inicio.setHours(0, 0, 0, 0);
      fin.setHours(23, 59, 59, 999);
      if (date >= inicio && date <= fin) {
        if (s.estado === 'Aprobada')  return 'dia-aprobada';
        if (s.estado === 'Pendiente') return 'dia-pendiente';
        if (s.estado === 'Rechazada') return 'dia-rechazada';
      }
    }
    return '';
  };

  readonly listaCalendarioVacia: VacacionesVista[] = [];
}
