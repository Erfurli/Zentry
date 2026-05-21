import {
  Component, ChangeDetectionStrategy, signal, computed, inject, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ReportesService, ReporteResumen, ResumenGeneral } from '../../services/reportes.service';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesComponent implements OnInit {
  private reportesService = inject(ReportesService);
  private exportService   = inject(ExportService);

  readonly reportes       = signal<ReporteResumen[]>([]);
  readonly resumen        = signal<ResumenGeneral | null>(null);
  readonly cargando       = signal(false);
  readonly cargandoExport = signal(false);
  readonly mensajeExport  = signal('');

  readonly filtroTipo         = signal('Todos');
  readonly filtroDepartamento = signal('Todos');
  readonly filtroYear         = signal<number>(new Date().getFullYear());
  readonly filtroMonth        = signal<number | null>(null);
  readonly filtroEstado       = signal('Todos');

  readonly anios = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);
  readonly meses = [
    { v: null,  l: 'Todos los meses' },
    { v: 1,  l: 'Enero' },   { v: 2,  l: 'Febrero' },
    { v: 3,  l: 'Marzo' },   { v: 4,  l: 'Abril' },
    { v: 5,  l: 'Mayo' },    { v: 6,  l: 'Junio' },
    { v: 7,  l: 'Julio' },   { v: 8,  l: 'Agosto' },
    { v: 9,  l: 'Septiembre' }, { v: 10, l: 'Octubre' },
    { v: 11, l: 'Noviembre' },  { v: 12, l: 'Diciembre' },
  ];

  readonly reportesFiltrados = computed(() => {
    const tipo  = this.filtroTipo();
    const depto = this.filtroDepartamento();
    return this.reportes().filter(r =>
      (tipo  === 'Todos' || r.tipo         === tipo) &&
      (depto === 'Todos' || r.departamento === depto)
    );
  });

  readonly totalGenerados  = computed(() => this.reportes().filter(r => r.estado === 'Generado').length);
  readonly totalPendientes = computed(() => this.reportes().filter(r => r.estado === 'Pendiente').length);
  readonly totalErrores    = computed(() => this.reportes().filter(r => r.estado === 'Error').length);
  readonly totalRegistros  = computed(() => this.reportes().reduce((a, r) => a + (r.registros ?? 0), 0));

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo(): void {
    this.cargando.set(true);
    forkJoin({
      reportes: this.reportesService.getReportes(
        this.filtroTipo() !== 'Todos' ? this.filtroTipo() : undefined,
        this.filtroYear(),
        this.filtroMonth() ?? undefined
      ),
      resumen: this.reportesService.getResumenGeneral(),
    }).subscribe({
      next: ({ reportes, resumen }) => {
        this.reportes.set(reportes);
        this.resumen.set(resumen);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  cambiarFiltroTipo(v: string):  void { this.filtroTipo.set(v);  this.cargarTodo(); }
  cambiarFiltroDepartamento(v: string): void { this.filtroDepartamento.set(v); }
  cambiarYear(e: Event):  void { this.filtroYear.set(+(e.target as HTMLSelectElement).value);  this.cargarTodo(); }
  cambiarMonth(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    this.filtroMonth.set(v ? +v : null);
    this.cargarTodo();
  }
  cambiarEstado(v: string): void { this.filtroEstado.set(v); }


  exportarAsistencia(): void {
  this.cargandoExport.set(true);
  this.reportesService.getDatosAsistencia({
    year:         this.filtroYear(),
    month:        this.filtroMonth() ?? undefined,
    departamento: this.filtroDepartamento() !== 'Todos' ? this.filtroDepartamento() : undefined,
  }).subscribe({
    next: datos => {
      const mes   = this.filtroMonth() ? `/${this.filtroMonth()}` : '';
      const depto = this.filtroDepartamento() !== 'Todos' ? ` · ${this.filtroDepartamento()}` : '';
      this.exportService.exportarReporteAsistencia(
        datos, `Asistencia ${this.filtroYear()}${mes}${depto}`
      );
      this.cargandoExport.set(false);
      this.flash('Asistencia exportada correctamente');
    },
    error: () => { this.cargandoExport.set(false); this.flash('Error al exportar'); }
  });
}

exportarVacaciones(): void {
  this.cargandoExport.set(true);
  this.reportesService.getDatosVacaciones({
    year:         this.filtroYear(),
    estado:       this.filtroEstado() !== 'Todos' ? this.filtroEstado() : undefined,
    departamento: this.filtroDepartamento() !== 'Todos' ? this.filtroDepartamento() : undefined,
  }).subscribe({
    next: datos => {
      const depto  = this.filtroDepartamento() !== 'Todos' ? ` · ${this.filtroDepartamento()}` : '';
      const estado = this.filtroEstado()        !== 'Todos' ? ` · ${this.filtroEstado()}`       : '';
      this.exportService.exportarReporteVacaciones(
        datos, `Vacaciones ${this.filtroYear()}${estado}${depto}`
      );
      this.cargandoExport.set(false);
      this.flash('Vacaciones exportadas correctamente');
    },
    error: () => { this.cargandoExport.set(false); this.flash('Error al exportar'); }
  });
}

exportarAusencias(): void {
  this.cargandoExport.set(true);
  this.reportesService.getDatosAusencias({
    year:         this.filtroYear(),
    estado:       this.filtroEstado() !== 'Todos' ? this.filtroEstado() : undefined,
    departamento: this.filtroDepartamento() !== 'Todos' ? this.filtroDepartamento() : undefined,
  }).subscribe({
    next: datos => {
      const depto  = this.filtroDepartamento() !== 'Todos' ? ` · ${this.filtroDepartamento()}` : '';
      const estado = this.filtroEstado()        !== 'Todos' ? ` · ${this.filtroEstado()}`       : '';
      this.exportService.exportarReporteAusencias(
        datos, `Ausencias ${this.filtroYear()}${estado}${depto}`
      );
      this.cargandoExport.set(false);
      this.flash('Ausencias exportadas correctamente');
    },
    error: () => { this.cargandoExport.set(false); this.flash('Error al exportar'); }
  });
}

  private flash(msg: string): void {
    this.mensajeExport.set(msg);
    setTimeout(() => this.mensajeExport.set(''), 3000);
  }
}
