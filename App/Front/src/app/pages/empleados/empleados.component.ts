import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Empleado } from '../../models/empleado.model';
import { EmpleadosService } from '../../services/empleados.service';
import { EmpleadoModalComponent } from '../../shared/modals/empleado-modal/empleado-modal.component';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [CommonModule, RouterLink, EmpleadoModalComponent],
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpleadosComponent implements OnInit {
  private empleadosService = inject(EmpleadosService);

  readonly empleados = signal<Empleado[]>([]);
  readonly filtroDepartamento = signal('Todos');
  readonly filtroEstado = signal('Todos');
  readonly modalAbierto = signal(false);
  readonly empleadoEditando = signal<Empleado | undefined>(undefined);

  readonly empleadosFiltrados = computed(() => {
    const depto = this.filtroDepartamento();
    const estado = this.filtroEstado();

    return this.empleados().filter((e) => {
      const coincideDepto = depto === 'Todos' || e.departamento === depto;
      const coincideEstado =
        estado === 'Todos' || (estado === 'Activos' ? e.activo : !e.activo);

      return coincideDepto && coincideEstado;
    });
  });

  readonly totalActivos = computed(
    () => this.empleados().filter((e) => e.activo).length,
  );
  readonly totalInactivos = computed(
    () => this.empleados().filter((e) => !e.activo).length,
  );

  ngOnInit(): void {
    this.cargarEmpleados();
  }

  cargarEmpleados(): void {
    this.empleadosService.getEmpleados().subscribe({
      next: (data) => this.empleados.set(data),
      error: (err) => console.error('Error cargando empleados', err),
    });
  }

  abrirModalEditar(empleado: Empleado): void {
    this.empleadoEditando.set(empleado);
    this.modalAbierto.set(true);
  }

  abrirModalCrear(): void {
    this.empleadoEditando.set(undefined);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.empleadoEditando.set(undefined);
  }

  onEmpleadoGuardado(actualizado: Empleado): void {
    this.empleados.update((lista) =>
      lista.map((e) => (e.id === actualizado.id ? actualizado : e)),
    );
    this.cerrarModal();
  }

  onDeptoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filtroDepartamento.set(select.value);
  }

  onEstadoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filtroEstado.set(select.value);
  }

  toggleActivo(id: number): void {
    this.empleadosService.toggleActivo(id).subscribe({
      next: (actualizado) => {
        this.empleados.update((lista) =>
          lista.map((e) => (e.id === id ? actualizado : e)),
        );
      },
      error: (err) => console.error('Error actualizando empleado', err),
    });
  }
}
