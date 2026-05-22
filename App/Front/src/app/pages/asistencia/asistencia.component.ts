import { Component, OnInit, inject, computed, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AsistenciaService } from '../../services/asistencia.service';
import { AuthService } from '../../services/auth.service';
import { AsistenciaHoy, AsistenciaVista, EstadoAsistencia } from '../../models/asistencia.model';
import { ExportService } from '../../services/export.service';

Chart.register(...registerables);

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.css']
})
export class AsistenciaComponent implements OnInit, AfterViewInit, OnDestroy {
  private asistenciaService = inject(AsistenciaService);
  private authService = inject(AuthService);
  private chart: Chart | null = null;
  private exportService = inject(ExportService);

  readonly empleados = signal<AsistenciaVista[]>([]);
  readonly filtroDepartamento = signal('Todos');
  readonly filtroEstado = signal('Todos');
  readonly filtroNombre = signal('');
  readonly vistaGrafico = signal(false);
  readonly fechaSeleccionada = signal(new Date().toISOString().split('T')[0]);
  readonly miAsistencia = signal<AsistenciaHoy | null>(null);
  readonly cargandoAccion = signal(false);
  readonly mensajeAccion = signal('');

  readonly modalFichajeAbierto = signal(false);
  readonly modalIncidenciaAbierto = signal(false);

  readonly modoTrabajo = signal<'PRESENCIAL' | 'REMOTO' | 'HIBRIDO'>('PRESENCIAL');

  readonly incidenciaEmpleadoId = signal('');
  readonly incidenciaFecha = signal(new Date().toISOString().split('T')[0]);
  readonly incidenciaEntrada = signal('');
  readonly incidenciaSalida = signal('');
  readonly incidenciaInicioDesc = signal('');
  readonly incidenciaFinDesc = signal('');
  readonly incidenciaAsistenciaId = signal('');
  readonly guardandoIncidencia = signal(false);
  readonly mensajeIncidencia = signal('');

  readonly modalIncidenciaEmpleadoAbierto = signal(false);
  readonly incTipo = signal('descanso_olvidado');
  readonly incInicioDesc = signal('');
  readonly incFinDesc = signal('');
  readonly incEntrada = signal('');
  readonly incSalida = signal('');
  readonly incDescripcion = signal('');
  readonly enviandoIncEmpleado = signal(false);
  readonly mensajeIncEmpleado = signal('');
  readonly errorIncEmpleado = signal('');

  readonly esAdmin = computed(() => this.authService.getSystemRole() === 'ADMIN');

  readonly esEmpleado = computed(() => {
    const companyRole = this.authService.getCompanyRole();
    return companyRole === 'EMPLEADO';
  });

  readonly puedeVerVistaPersonal = computed(() => this.esEmpleado() || this.esAdmin());

  readonly esFuturo = computed(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return new Date(this.fechaSeleccionada() + 'T00:00:00') > hoy;
  });

  readonly empleadosFiltrados = computed(() => {
    const dep = this.filtroDepartamento();
    const est = this.filtroEstado();
    const nom = this.filtroNombre().trim().toLowerCase();
    return this.empleados().filter(e =>
      (dep === 'Todos' || e.departamento === dep) &&
      (est === 'Todos' || e.estado === est) &&
      (!nom || e.nombre.toLowerCase().includes(nom))
    );
  });

  readonly totalPresentes = computed(() => this.empleados().filter(e => e.estado === 'Presente' || e.estado === 'TRABAJANDO').length);
  readonly totalRetrasos = computed(() => this.empleados().filter(e => e.estado === 'Retraso').length);
  readonly totalAusentes = computed(() => this.empleados().filter(e => e.estado === 'Ausente' || e.estado === 'NO_FICHADO').length);
  readonly totalEmpleados = computed(() => this.empleados().length);

  get estadoActual(): EstadoAsistencia | null {
    return this.miAsistencia()?.estado ?? null;
  }

  puedeFicharEntrada(): boolean {
    const e = this.estadoActual;
    return !e || e === 'NO_FICHADO' || e === 'FINALIZADO';
  }

  puedeIniciarDescanso(): boolean {
    return this.estadoActual === 'TRABAJANDO';
  }

  puedeFinalizarDescanso(): boolean {
    return this.estadoActual === 'EN_DESCANSO';
  }

  puedeFicharSalida(): boolean {
    return this.estadoActual === 'TRABAJANDO' || this.estadoActual === 'EN_DESCANSO';
  }

  labelEstado(): string {
    const mapa: Record<string, string> = {
      NO_FICHADO: 'Sin fichar',
      TRABAJANDO: 'Trabajando',
      EN_DESCANSO: 'En descanso',
      FINALIZADO: 'Jornada finalizada'
    };
    return mapa[this.estadoActual ?? 'NO_FICHADO'] ?? (this.estadoActual ?? 'Sin fichar');
  }

  ngOnInit(): void {
    this.cargarDatos();
    if (this.puedeVerVistaPersonal()) {
      this.cargarMiAsistenciaHoy();
      this.cargarMisRegistros();
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  cargarDatos(): void {
    const peticion = this.puedeVerVistaPersonal()
      ? this.asistenciaService.getMisAsistencias(this.fechaSeleccionada())
      : this.asistenciaService.getAsistenciaVista(this.fechaSeleccionada());

    peticion.subscribe({
      next: data => this.empleados.set(data),
      error: (err: unknown) => console.error('Error cargando asistencia', err)
    });
  }

  cargarMiAsistenciaHoy(): void {
    this.asistenciaService.getHoy().subscribe({
      next: data => this.miAsistencia.set(data),
      error: () => this.miAsistencia.set(null)
    });
  }

  refrescarTodo(): void {
    this.cargarDatos();
    if (this.puedeVerVistaPersonal()) this.cargarMiAsistenciaHoy();
    if (this.vistaGrafico()) setTimeout(() => this.renderChart(), 0);
  }

  ficharEntrada(): void { this.ejecutarAccion(() => this.asistenciaService.ficharEntrada()); }
  iniciarDescanso(): void { this.ejecutarAccion(() => this.asistenciaService.iniciarDescanso()); }
  finalizarDescanso(): void { this.ejecutarAccion(() => this.asistenciaService.finalizarDescanso()); }
  ficharSalida(): void { this.ejecutarAccion(() => this.asistenciaService.ficharSalida()); }

  private ejecutarAccion(fn: () => any): void {
    this.cargandoAccion.set(true);
    this.mensajeAccion.set('');
    fn().subscribe({
      next: (res: any) => {
        this.mensajeAccion.set(res?.mensaje ?? 'Acción realizada correctamente.');
        this.cargandoAccion.set(false);
        this.modalFichajeAbierto.set(false);
        this.refrescarTodo();
      },
      error: (err: any) => {
        this.mensajeAccion.set(err?.error?.mensaje ?? 'No se pudo realizar la acción.');
        this.cargandoAccion.set(false);
        this.refrescarTodo();
      }
    });
  }

  ejecutarFichaje(tipo: 'entrada' | 'descanso' | 'vuelta' | 'salida'): void {
    const acciones = {
      entrada: () => this.ficharEntrada(),
      descanso: () => this.iniciarDescanso(),
      vuelta: () => this.finalizarDescanso(),
      salida: () => this.ficharSalida(),
    };
    acciones[tipo]();
  }

  abrirIncidencia(empleado: AsistenciaVista): void {
    this.incidenciaEmpleadoId.set(empleado.empleadoId ?? '');
    this.incidenciaAsistenciaId.set(empleado.id ?? '');
    this.incidenciaFecha.set(empleado.fecha ?? this.fechaSeleccionada());
    this.incidenciaEntrada.set(empleado.entrada ?? '');
    this.incidenciaSalida.set(empleado.salida ?? '');
    this.incidenciaInicioDesc.set(empleado.inicioDescanso ?? '');
    this.incidenciaFinDesc.set(empleado.finDescanso ?? '');
    this.mensajeIncidencia.set('');
    this.modalIncidenciaAbierto.set(true);
  }

  guardarIncidencia(): void {
    const id = this.incidenciaAsistenciaId();
    if (!id) {
      this.mensajeIncidencia.set('No hay registro de asistencia para este día.');
      return;
    }

    this.guardandoIncidencia.set(true);
    this.asistenciaService.corregirAsistencia(id, {
      entrada: this.incidenciaEntrada() || undefined,
      salida: this.incidenciaSalida() || undefined,
      inicioDescanso: this.incidenciaInicioDesc() || undefined,
      finDescanso: this.incidenciaFinDesc() || undefined,
    }).subscribe({
      next: (res) => {
        this.mensajeIncidencia.set(res.mensaje);
        this.guardandoIncidencia.set(false);
        this.refrescarTodo();
        setTimeout(() => this.modalIncidenciaAbierto.set(false), 1200);
      },
      error: (err) => {
        this.mensajeIncidencia.set(err?.error?.mensaje ?? 'Error al guardar.');
        this.guardandoIncidencia.set(false);
      }
    });
  }

  onDeptoChange(e: Event): void { this.filtroDepartamento.set((e.target as HTMLSelectElement).value); }
  onEstadoChange(e: Event): void { this.filtroEstado.set((e.target as HTMLSelectElement).value); }
  onNombreChange(e: Event): void { this.filtroNombre.set((e.target as HTMLInputElement).value); }

  onFechaChange(e: Event): void {
    this.fechaSeleccionada.set((e.target as HTMLInputElement).value);
    this.cargarDatos();
    if (this.vistaGrafico()) setTimeout(() => this.renderChart(), 0);
  }

  activarVistaGrafico(): void {
    this.vistaGrafico.set(true);
    setTimeout(() => this.renderChart(), 0);
  }

  activarVistaLista(): void {
    this.vistaGrafico.set(false);
    this.chart?.destroy();
    this.chart = null;
  }

  renderChart(): void {
    this.chart?.destroy();
    const canvas = document.getElementById('donutAsistencia') as HTMLCanvasElement;
    if (!canvas) return;

    const dep = this.filtroDepartamento();
    const datos = this.empleados().filter(e => dep === 'Todos' || e.departamento === dep);
    const presentes = datos.filter(e => e.estado === 'Presente' || e.estado === 'TRABAJANDO').length;
    const retrasos = datos.filter(e => e.estado === 'Retraso').length;
    const ausentes = datos.filter(e => e.estado === 'Ausente' || e.estado === 'NO_FICHADO').length;
    const total = datos.length;

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Presentes', 'Con retraso', 'Ausentes'],
        datasets: [{
          data: [presentes, retrasos, ausentes],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderColor: ['#ffffff', '#ffffff', '#ffffff'],
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              }
            }
          }
        }
      }
    };

    this.chart = new Chart<'doughnut'>(canvas, config);
  }

  getPorcentaje(valor: number): number {
    const total = this.totalEmpleados();
    return total > 0 ? Math.round((valor / total) * 100) : 0;
  }

  abrirIncidenciaEmpleado(): void {
    const a = this.miAsistencia();
    this.incTipo.set('descanso_olvidado');
    this.incInicioDesc.set(a?.inicioDescanso ?? '');
    this.incFinDesc.set(a?.finDescanso ?? '');
    this.incEntrada.set(a?.entrada ?? '');
    this.incSalida.set(a?.salida ?? '');
    this.incDescripcion.set('');
    this.mensajeIncEmpleado.set('');
    this.errorIncEmpleado.set('');
    this.modalIncidenciaEmpleadoAbierto.set(true);
  }

  enviarIncidenciaEmpleado(): void {
    const id = this.miAsistencia()?.id;
    if (!id) {
      this.errorIncEmpleado.set('No hay registro de asistencia para hoy.');
      return;
    }

    this.enviandoIncEmpleado.set(true);
    this.mensajeIncEmpleado.set('');
    this.errorIncEmpleado.set('');

    this.asistenciaService.reportarIncidencia(id, {
      tipo: this.incTipo(),
      descripcion: this.incDescripcion(),
      inicioDescanso: this.incInicioDesc() || undefined,
      finDescanso: this.incFinDesc() || undefined,
      entrada: this.incEntrada() || undefined,
      salida: this.incSalida() || undefined,
    }).subscribe({
      next: (res) => {
        this.mensajeIncEmpleado.set(res.mensaje);
        this.enviandoIncEmpleado.set(false);
        this.cargarMiAsistenciaHoy();
        setTimeout(() => this.modalIncidenciaEmpleadoAbierto.set(false), 1800);
      },
      error: (err) => {
        this.errorIncEmpleado.set(err?.error?.mensaje ?? 'No se pudo enviar la incidencia.');
        this.enviandoIncEmpleado.set(false);
      }
    });
  }

  exportar(): void {
    this.exportService.exportarAsistenciaExcel(
      this.empleadosFiltrados(),
      this.puedeVerVistaPersonal() ? 'Asistencia personal' : `Asistencia ${this.fechaSeleccionada()}`
    );
  }

  readonly misRegistros = signal<AsistenciaVista[]>([]);
  readonly cargandoLog = signal(false);
  readonly filtroModo = signal('Todos');
  readonly filtroIncidencia = signal('Todos');
  readonly paginaActual = signal(1);
  readonly registrosPorPagina = 8;
  readonly logAbierto = signal(false);

  readonly registrosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.registrosPorPagina;
    return this.misRegistros().slice(inicio, inicio + this.registrosPorPagina);
  });

  readonly totalPaginas = computed(() =>
    Math.ceil(this.misRegistros().length / this.registrosPorPagina)
  );

  readonly paginasArray = computed(() =>
    Array.from({ length: this.totalPaginas() }, (_, i) => i + 1)
  );

  readonly registrosSinIncidencia = computed(() =>
    this.misRegistros().filter(r => !r.incidenciaTipo).length
  );

  readonly registrosConIncidencia = computed(() =>
    this.misRegistros().filter(r => r.incidenciaTipo).length
  );

  cargarMisRegistros(): void {
    this.cargandoLog.set(true);
    this.asistenciaService.getMisRegistros({
      modo: this.filtroModo(),
      incidencia: this.filtroIncidencia(),
    }).subscribe({
      next: data => {
        this.misRegistros.set(data);
        this.paginaActual.set(1);
        this.cargandoLog.set(false);
      },
      error: () => this.cargandoLog.set(false),
    });
  }

  abrirLog(): void {
    this.logAbierto.set(true);
    this.cargarMisRegistros();
  }

  onFiltroModoChange(e: Event): void {
    this.filtroModo.set((e.target as HTMLSelectElement).value);
    this.cargarMisRegistros();
  }

  onFiltroIncidenciaChange(e: Event): void {
    this.filtroIncidencia.set((e.target as HTMLSelectElement).value);
    this.cargarMisRegistros();
  }

  irPagina(p: number): void { this.paginaActual.set(p); }
  paginaAnterior(): void { if (this.paginaActual() > 1) this.paginaActual.update(p => p - 1); }
  paginaSiguiente(): void { if (this.paginaActual() < this.totalPaginas()) this.paginaActual.update(p => p + 1); }

  labelModo(modo?: string | null): string {
    const mapa: Record<string, string> = {
      PRESENCIAL: 'Presencial',
      REMOTO: 'Remoto',
      HIBRIDO: 'Híbrido',
    };
    return mapa[modo ?? ''] ?? modo ?? '-';
  }

  labelIncidencia(tipo?: string | null): string {
    const mapa: Record<string, string> = {
      descanso_olvidado: 'Descanso olvidado',
      descanso_incorrecto: 'Descanso incorrecto',
      entrada_incorrecta: 'Entrada incorrecta',
      salida_incorrecta: 'Salida incorrecta',
      otro: 'Otro',
    };
    return mapa[tipo ?? ''] ?? tipo ?? '';
  }

  abrirIncidenciaDesdeLog(r: AsistenciaVista): void {
    const a = r as any;
    this.incTipo.set('descanso_olvidado');
    this.incInicioDesc.set(a.inicioDescanso ?? '');
    this.incFinDesc.set(a.finDescanso ?? '');
    this.incEntrada.set(a.entrada ?? '');
    this.incSalida.set(a.salida ?? '');
    this.incDescripcion.set('');
    this.mensajeIncEmpleado.set('');
    this.errorIncEmpleado.set('');
    this.miAsistencia.update(m => m ? { ...m, id: a.id } : m);
    this.modalIncidenciaEmpleadoAbierto.set(true);
  }
}
