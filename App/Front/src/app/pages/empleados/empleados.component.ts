import {
  Component, ChangeDetectionStrategy, computed, inject, OnInit, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Empleado } from '../../models/empleado.model';
import { Usuario } from '../../models/usuario.model';
import { EmpleadosService } from '../../services/empleados.service';
import { UsuariosService } from '../../services/usuario.service';
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
  private usuariosService = inject(UsuariosService);

  readonly empleados = signal<Empleado[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly filtroDepartamento = signal('Todos');
  readonly modalAbierto = signal(false);
  readonly empleadoEditando = signal<Empleado | undefined>(undefined);
  readonly empleadoInfo = signal<Empleado | undefined>(undefined);
  readonly modalInfoAbierto = signal(false);

  readonly empleadosFiltrados = computed(() => {
    const depto = this.filtroDepartamento();
    return this.empleados().filter(e =>
      depto === 'Todos' || e.departamento === depto
    );
  });

  ngOnInit(): void {
    this.cargarEmpleados();
    this.usuariosService.getUsuarios().subscribe({
      next: data => this.usuarios.set(data)
    });
  }

  cargarEmpleados(): void {
    this.empleadosService.getEmpleados().subscribe({
      next: data => this.empleados.set(data),
      error: err => console.error('Error cargando empleados', err),
    });
  }

  getUsuarioDeEmpleado(empleadoId: string): Usuario | undefined {
    return this.usuarios().find(u => u.empleadoId === empleadoId);
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

  abrirModalInfo(empleado: Empleado): void {
    this.empleadoInfo.set(empleado);
    this.modalInfoAbierto.set(true);
  }

  cerrarModalInfo(): void {
    this.modalInfoAbierto.set(false);
    this.empleadoInfo.set(undefined);
  }

  onEmpleadoGuardado(actualizado: Empleado): void {
    this.empleados.update(lista => {
      const existe = lista.some(e => e.id === actualizado.id);
      return existe
        ? lista.map(e => e.id === actualizado.id ? actualizado : e)
        : [...lista, actualizado];
    });
    this.cerrarModal();
  }

  onDeptoChange(event: Event): void {
    this.filtroDepartamento.set((event.target as HTMLSelectElement).value);
  }
}
