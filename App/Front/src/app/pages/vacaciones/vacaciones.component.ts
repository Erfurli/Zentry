import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VacacionesService, VacacionesVista } from '../../services/vacaciones.service';

type EstadoSolicitud = 'Aprobada' | 'Pendiente' | 'Rechazada';

@Component({
  selector: 'app-vacaciones',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './vacaciones.component.html',
  styleUrl: './vacaciones.component.css'
})
export class VacacionesComponent implements OnInit {
  private vacacionesService = inject(VacacionesService);

  readonly solicitudes = signal<VacacionesVista[]>([]);
  readonly filtroEstado = signal<EstadoSolicitud | 'Todos'>('Todos');
  readonly filtroDepartamento = signal<string>('Todos');

  readonly solicitudesFiltradas = computed(() => {
    const estado = this.filtroEstado();
    const depto = this.filtroDepartamento();

    return this.solicitudes().filter((s) => {
      const coincideEstado = estado === 'Todos' || s.estado === estado;
      const coincideDepto = depto === 'Todos' || s.departamento === depto;
      return coincideEstado && coincideDepto;
    });
  });

  readonly totalAprobadas = computed(() =>
    this.solicitudes().filter((s) => s.estado === 'Aprobada').length
  );

  readonly totalPendientes = computed(() =>
    this.solicitudes().filter((s) => s.estado === 'Pendiente').length
  );

  readonly totalRechazadas = computed(() =>
    this.solicitudes().filter((s) => s.estado === 'Rechazada').length
  );

  readonly totalDiasSolicitados = computed(() =>
    this.solicitudes().reduce((acc, s) => acc + s.dias, 0)
  );

  ngOnInit(): void {
    this.cargarVacaciones();
  }

  cargarVacaciones(): void {
    this.vacacionesService.getVacacionesVista().subscribe({
      next: (data) => this.solicitudes.set(data),
      error: (err) => console.error('Error cargando vacaciones', err)
    });
  }

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor as EstadoSolicitud | 'Todos');
  }

  cambiarFiltroDepartamento(valor: string): void {
    this.filtroDepartamento.set(valor);
  }

  aprobar(id: string): void {
    this.vacacionesService.aprobar(id).subscribe({
      next: () => this.cargarVacaciones(),
      error: (err) => console.error('Error al aprobar vacaciones', err)
    });
  }

  rechazar(id: string): void {
    this.vacacionesService.rechazar(id).subscribe({
      next: () => this.cargarVacaciones(),
      error: (err) => console.error('Error al rechazar vacaciones', err)
    });
  }

  exportar(): void {
    alert('Exportación conectada al backend próximamente');
  }
}
