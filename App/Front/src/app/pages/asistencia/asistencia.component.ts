import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AsistenciaService, AsistenciaVista } from '../../services/asistencia.service';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.css']
})
export class AsistenciaComponent implements OnInit {
  private asistenciaService = inject(AsistenciaService);

  readonly empleados = signal<AsistenciaVista[]>([]);
  readonly filtroDepartamento = signal('Todos');
  readonly filtroEstado = signal('Todos');

  readonly empleadosFiltrados = computed(() => {
    const departamento = this.filtroDepartamento();
    const estado = this.filtroEstado();

    return this.empleados().filter((empleado) => {
      const coincideDepartamento =
        departamento === 'Todos' || empleado.departamento === departamento;

      const coincideEstado =
        estado === 'Todos' || empleado.estado === estado;

      return coincideDepartamento && coincideEstado;
    });
  });

  readonly totalPresentes = computed(() =>
    this.empleados().filter(e => e.estado === 'Presente').length
  );

  readonly totalRetrasos = computed(() =>
    this.empleados().filter(e => e.estado === 'Retraso').length
  );

  readonly totalAusentes = computed(() =>
    this.empleados().filter(e => e.estado === 'Ausente').length
  );

  readonly totalEmpleados = computed(() => this.empleados().length);

  ngOnInit(): void {
    // this.asistenciaService.getAsistenciaVista().subscribe({
    //   next: data => this.empleados.set(data),
    //   error: err => console.error('Error cargando asistencia', err)
    // });
  }

  onDeptoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filtroDepartamento.set(select.value);
  }

  onEstadoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filtroEstado.set(select.value);
  }
}
