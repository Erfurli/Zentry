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

import * as XLSX from 'xlsx-js-style';
import { ExportService } from '../../services/export.service';
import { BadgesService } from '../../services/badges.service';

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
  private exportService = inject(ExportService);
  private badgesService = inject(BadgesService);


  readonly isEmpleado: boolean = this.authService.getCompanyRole() === 'EMPLEADO';

  readonly ausencias = signal<AusenciaVista[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly filtroTipo = signal('Todos');
  readonly filtroEstado = signal('Todos');
  readonly filtroNombre = signal('');

  readonly modalAbierto = signal(false);
  readonly enviando = signal(false);
  readonly mensajeExito = signal('');
  readonly errorModal = signal('');

  readonly formTipo = signal('Enfermedad');
  readonly formFechaInicio = signal('');
  readonly formFechaFin = signal('');
  readonly formMotivo = signal('');

  readonly formJustificanteBase64 = signal<string | null>(null);
readonly formJustificanteNombre = signal<string | null>(null);
readonly formJustificanteTipo   = signal<string | null>(null);
readonly subiendoJustificante   = signal(false);

  readonly ausenciasFiltradas = computed(() => {
    const tipo = this.filtroTipo();
    const estado = this.filtroEstado();
    const nom = this.filtroNombre().trim().toLowerCase();
    return this.ausencias().filter(a => {
      const coincideTipo = tipo === 'Todos' || a.tipo === tipo;
      const coincideEstado = estado === 'Todos' || a.estado === estado;
      const coincideNombre = !nom || a.empleado.toLowerCase().includes(nom);
      return coincideTipo && coincideEstado && coincideNombre;
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
    this.badgesService.recargarAusencias();
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
    this.formJustificanteBase64.set(null);
  this.formJustificanteNombre.set(null);
  this.formJustificanteTipo.set(null);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  onArchivoSeleccionado(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!tiposPermitidos.includes(file.type)) {
    this.errorModal.set('Solo se permiten imágenes (JPG, PNG) o PDF.');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    this.errorModal.set('El archivo no puede superar 5 MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    this.formJustificanteBase64.set(reader.result as string);
    this.formJustificanteNombre.set(file.name);
    this.formJustificanteTipo.set(file.type);
    this.errorModal.set('');
  };
  reader.readAsDataURL(file);
}

quitarJustificante(): void {
  this.formJustificanteBase64.set(null);
  this.formJustificanteNombre.set(null);
  this.formJustificanteTipo.set(null);
}

subirJustificanteExistente(id: string, event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!tiposPermitidos.includes(file.type)) {
    this.error.set('Solo se permiten imágenes (JPG, PNG) o PDF.');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    this.error.set('El archivo no puede superar 5 MB.');
    return;
  }

  this.subiendoJustificante.set(true);
  const reader = new FileReader();
  reader.onload = () => {
    this.ausenciasService.subirJustificante(id, reader.result as string, file.name, file.type)
      .subscribe({
        next: () => {
          this.subiendoJustificante.set(false);
          this.cargarAusencias();
        },
        error: () => {
          this.subiendoJustificante.set(false);
          this.error.set('Error al subir el justificante.');
        }
      });
  };
  reader.readAsDataURL(file);
}

verJustificante(ausencia: AusenciaVista): void {
  if (!ausencia.justificanteBase64) return;
  const link = document.createElement('a');
  link.href = ausencia.justificanteBase64;
  link.download = ausencia.justificanteNombre ?? 'justificante';
  link.click();
}


  enviarSolicitud(): void {
  if (!this.formValido() || this.enviando()) return;
  this.enviando.set(true);
  this.errorModal.set('');

  this.ausenciasService.solicitar({
    fechaInicio:          this.formFechaInicio(),
    fechaFin:             this.formFechaFin(),
    tipo:                 this.formTipo(),
    motivo:               this.formMotivo(),
    justificanteBase64:   this.formJustificanteBase64() ?? undefined,
    justificanteNombre:   this.formJustificanteNombre() ?? undefined,
    justificanteTipo:     this.formJustificanteTipo() ?? undefined,
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

  onNombreChange(event: Event): void {
    this.filtroNombre.set((event.target as HTMLInputElement).value);
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

  exportar(): void {
  this.exportService.exportarAusenciasExcel(
    this.ausenciasFiltradas(),
    this.isEmpleado ? 'Mis ausencias' : 'Todos los empleados'
  );
}


}
