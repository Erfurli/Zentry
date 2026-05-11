import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AusenciasService, AusenciaVista } from '../../services/ausencias.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ausencias',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './ausencias.component.html',
  styleUrl: './ausencias.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AusenciasComponent implements OnInit {
  private ausenciasService = inject(AusenciasService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  readonly isEmpleado: boolean = this.authService.getCompanyRole() === 'EMPLEADO';

  readonly ausencias = signal<AusenciaVista[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly filtroTipo = signal('Todos');
  readonly filtroEstado = signal('Todos');

  readonly modalAbierto = signal(false);
  readonly enviando = signal(false);
  readonly mensajeExito = signal('');
  readonly errorModal = signal('');

  readonly formTipo = signal('Enfermedad');
  readonly formFechaInicio = signal('');
  readonly formFechaFin = signal('');
  readonly formMotivo = signal('');

  readonly ausenciasFiltradas = computed(() => {
    const tipo = this.filtroTipo();
    const estado = this.filtroEstado();
    return this.ausencias().filter(a => {
      const coincideTipo = tipo === 'Todos' || a.tipo === tipo;
      const coincideEstado = estado === 'Todos' || a.estado === estado;
      return coincideTipo && coincideEstado;
    });
  });

  readonly totalJustificadas = computed(() =>
    this.ausencias().filter(a => a.estado === 'Justificada').length
  );
  readonly totalPendientes = computed(() =>
    this.ausencias().filter(a => a.estado === 'Pendiente').length
  );
  readonly totalNoJustificadas = computed(() =>
    this.ausencias().filter(a => a.estado === 'No Justificada').length
  );

  readonly formValido = computed(() =>
    this.formFechaInicio().length > 0 && this.formFechaFin().length > 0
    && this.formFechaFin() >= this.formFechaInicio()
  );

  ngOnInit(): void {
    this.cargarAusencias();

    this.route.queryParams.subscribe(params => {
      if (params['nuevo'] === 'true') {
        this.abrirModal();
      }
    });
  }

  cargarAusencias(): void {
    this.loading.set(true);
    this.error.set('');

    const peticion = this.isEmpleado
      ? this.ausenciasService.getMisAusencias()
      : this.ausenciasService.getVista();

    peticion.subscribe({
      next: (data) => {
        this.ausencias.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las ausencias. Comprueba la conexión.');
        this.loading.set(false);
      }
    });
  }

  abrirModal(): void {
    this.formTipo.set('Enfermedad');
    this.formFechaInicio.set('');
    this.formFechaFin.set('');
    this.formMotivo.set('');
    this.mensajeExito.set('');
    this.errorModal.set('');
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  enviarSolicitud(): void {
    if (!this.formValido() || this.enviando()) return;

    this.enviando.set(true);
    this.errorModal.set('');

    this.ausenciasService.solicitar({
      fechaInicio: this.formFechaInicio(),
      fechaFin: this.formFechaFin(),
      tipo: this.formTipo(),
      motivo: this.formMotivo()
    }).subscribe({
      next: () => {
        this.mensajeExito.set('¡Ausencia solicitada correctamente!');
        this.enviando.set(false);
        this.cargarAusencias();
        setTimeout(() => this.cerrarModal(), 1800);
      },
      error: () => {
        this.errorModal.set('Error al enviar la solicitud. Inténtalo de nuevo.');
        this.enviando.set(false);
      }
    });
  }

  onTipoChange(event: Event): void {
    this.filtroTipo.set((event.target as HTMLSelectElement).value);
  }

  onEstadoChange(event: Event): void {
    this.filtroEstado.set((event.target as HTMLSelectElement).value);
  }

  justificar(id: string): void {
    this.ausenciasService.justificar(id).subscribe({
      next: () => this.cargarAusencias(),
      error: () => this.error.set('Error al justificar la ausencia.')
    });
  }

  noJustificar(id: string): void {
    this.ausenciasService.noJustificar(id).subscribe({
      next: () => this.cargarAusencias(),
      error: () => this.error.set('Error al actualizar el estado.')
    });
  }
}
