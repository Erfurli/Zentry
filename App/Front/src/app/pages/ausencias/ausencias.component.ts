import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Ausencia {
  id: number;
  empleado: string;
  departamento: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  tipo: 'Enfermedad' | 'Asunto Personal' | 'Médico' | 'Familiar';
  estado: 'Justificada' | 'Pendiente' | 'No Justificada';
}

@Component({
  selector: 'app-ausencias',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ausencias.component.html',
  styleUrl: './ausencias.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AusenciasComponent {
  readonly ausencias = signal<Ausencia[]>([
    { id: 1, empleado: 'Ana López', departamento: 'RRHH', fechaInicio: '15/03/2026', fechaFin: '17/03/2026', dias: 3, tipo: 'Enfermedad', estado: 'Justificada' },
    { id: 2, empleado: 'Carlos García', departamento: 'IT', fechaInicio: '20/03/2026', fechaFin: '20/03/2026', dias: 1, tipo: 'Asunto Personal', estado: 'Pendiente' },
    { id: 3, empleado: 'María Pérez', departamento: 'Ventas', fechaInicio: '10/03/2026', fechaFin: '12/03/2026', dias: 3, tipo: 'Médico', estado: 'Justificada' },
  ]);

  readonly filtroTipo = signal('Todos');
  readonly filtroEstado = signal('Todos');

  readonly ausenciasFiltradas = computed(() => {
    const tipo = this.filtroTipo();
    const estado = this.filtroEstado();
    return this.ausencias().filter(a => {
      const coincideTipo = tipo === 'Todos' || a.tipo === tipo;
      const coincideEstado = estado === 'Todos' || a.estado === estado;
      return coincideTipo && coincideEstado;
    });
  });

  readonly totalJustificadas = computed(() => this.ausencias().filter(a => a.estado === 'Justificada').length);
  readonly totalPendientes = computed(() => this.ausencias().filter(a => a.estado === 'Pendiente').length);
  readonly totalNoJustificadas = computed(() => this.ausencias().filter(a => a.estado === 'No Justificada').length);


  cambiarFiltroTipo(valor: string): void {
    this.filtroTipo.set(valor);
  }

  cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor);
  }

  onTipoChange(event: Event): void {
  const select = event.target as HTMLSelectElement;
  this.filtroTipo.set(select.value);
}

onEstadoChange(event: Event): void {
  const select = event.target as HTMLSelectElement;
  this.filtroEstado.set(select.value);
}

justificar(id: number): void {
  this.ausencias.update(lista =>
    lista.map(a => a.id === id ? { ...a, estado: 'Justificada' } : a)
  );
}

noJustificar(id: number): void {
  this.ausencias.update(lista =>
    lista.map(a => a.id === id ? { ...a, estado: 'No Justificada' } : a)
  );
}


}
