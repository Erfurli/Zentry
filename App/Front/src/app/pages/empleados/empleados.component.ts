import {
  Component, ChangeDetectionStrategy, computed, inject, OnInit, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';

import { Empleado } from '../../models/empleado.model';
import { Usuario } from '../../models/usuario.model';
import { EmpleadosService } from '../../services/empleados.service';
import { UsuariosService } from '../../services/usuario.service';
import { AsistenciaService, AsistenciaRaw } from '../../services/asistencia.service';
import { AusenciasService, AusenciaVista } from '../../services/ausencias.service';
import { VacacionesService, VacacionesVista } from '../../services/vacaciones.service';
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
  private empleadosService  = inject(EmpleadosService);
  private usuariosService   = inject(UsuariosService);
  private asistenciaService = inject(AsistenciaService);
  private ausenciasService  = inject(AusenciasService);
  private vacacionesService = inject(VacacionesService);

  readonly empleados           = signal<Empleado[]>([]);
  readonly usuarios            = signal<Usuario[]>([]);
  readonly filtroDepartamento  = signal('Todos');
  readonly modalAbierto        = signal(false);
  readonly empleadoEditando    = signal<Empleado | undefined>(undefined);
  readonly empleadoInfo        = signal<Empleado | undefined>(undefined);
  readonly modalInfoAbierto    = signal(false);

  // ─── Export signals ───────────────────────────────────────────────────────
  readonly modalExportarAbierto  = signal(false);
  readonly empleadoExportando    = signal<Empleado | undefined>(undefined);
  readonly formatoExportar       = signal<'csv' | 'excel'>('csv');
  readonly exportando            = signal(false);

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

  // ─── Export ───────────────────────────────────────────────────────────────

  abrirModalExportar(empleado: Empleado): void {
    this.empleadoExportando.set(empleado);
    this.formatoExportar.set('csv');
    this.modalExportarAbierto.set(true);
  }

  cerrarModalExportar(): void {
    this.modalExportarAbierto.set(false);
    this.empleadoExportando.set(undefined);
  }

  onFormatoChange(event: Event): void {
    this.formatoExportar.set((event.target as HTMLSelectElement).value as 'csv' | 'excel');
  }

  confirmarExportar(): void {
    const empleado = this.empleadoExportando();
    if (!empleado) return;

    this.exportando.set(true);

    const hoy       = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(haceUnMes.getMonth() - 1);

    forkJoin({
      asistencias: this.asistenciaService.getAll(),
      ausencias:   this.ausenciasService.getVista(),
      vacaciones:  this.vacacionesService.getVacacionesVista(),
    }).subscribe({
      next: ({ asistencias, ausencias, vacaciones }) => {
        const asistenciasEmpleado = asistencias
          .filter(a => a.empleadoId === empleado.id)
          .filter(a => {
            const fecha = new Date(a.fecha);
            return fecha >= haceUnMes && fecha <= hoy;
          })
          .sort((a, b) => a.fecha.localeCompare(b.fecha));

        const ausenciasEmpleado  = ausencias.filter(a => a.empleadoId === empleado.id);
        const vacacionesEmpleado = vacaciones.filter(v => v.empleadoId === empleado.id);

        if (this.formatoExportar() === 'csv') {
          this.exportarCSV(empleado, asistenciasEmpleado, ausenciasEmpleado, vacacionesEmpleado);
        } else {
          this.exportarExcel(empleado, asistenciasEmpleado, ausenciasEmpleado, vacacionesEmpleado);
        }

        this.exportando.set(false);
        this.cerrarModalExportar();
      },
      error: err => {
        console.error('Error exportando datos', err);
        this.exportando.set(false);
      },
    });
  }

  // ─── CSV ──────────────────────────────────────────────────────────────────

  private exportarCSV(
    empleado:    Empleado,
    asistencias: AsistenciaRaw[],
    ausencias:   AusenciaVista[],
    vacaciones:  VacacionesVista[]
  ): void {
    const lines: string[] = [];

    lines.push('DATOS DEL EMPLEADO');
    lines.push(`Nombre,${this.csvVal(empleado.nombre)}`);
    lines.push(`Email,${this.csvVal(empleado.email)}`);
    lines.push(`DNI,${this.csvVal(empleado.dni)}`);
    lines.push(`Departamento,${this.csvVal(empleado.departamento)}`);
    lines.push(`Puesto,${this.csvVal(empleado.puesto)}`);
    lines.push(`Rol empresa,${this.csvVal(empleado.rolEmpresa)}`);
    lines.push(`Fecha alta,${this.csvVal(empleado.fechaAlta)}`);
    lines.push(`Estado,${empleado.activo ? 'Activo' : 'Inactivo'}`);
    lines.push('');

    lines.push('ASISTENCIA - ÚLTIMO MES');
    lines.push('Fecha,Entrada,Salida,Horas,Modo');
    if (asistencias.length === 0) {
      lines.push('Sin registros en el último mes');
    } else {
      for (const a of asistencias) {
        lines.push(
          `${a.fecha},${a.entrada ?? '-'},${a.salida ?? '-'},${a.horas ?? '-'},${this.csvVal(a.modo ?? '-')}`
        );
      }
    }
    lines.push('');

    lines.push('AUSENCIAS');
    lines.push('Fecha inicio,Fecha fin,Días,Tipo,Estado,Motivo,Fecha solicitud');
    if (ausencias.length === 0) {
      lines.push('Sin ausencias registradas');
    } else {
      for (const a of ausencias) {
        lines.push(
          `${a.fechaInicio},${a.fechaFin},${a.dias},${a.tipo},${a.estado},${this.csvVal(a.motivo ?? '')},${a.fechaSolicitud ?? ''}`
        );
      }
    }
    lines.push('');

    lines.push('VACACIONES');
    lines.push('Fecha inicio,Fecha fin,Días,Estado');
    if (vacaciones.length === 0) {
      lines.push('Sin vacaciones registradas');
    } else {
      for (const v of vacaciones) {
        lines.push(`${v.fechaInicio},${v.fechaFin},${v.dias},${v.estado}`);
      }
    }

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    this.descargarBlob(blob, `${this.nombreArchivo(empleado)}.csv`);
  }

  // ─── Excel ────────────────────────────────────────────────────────────────

  private exportarExcel(
    empleado:    Empleado,
    asistencias: AsistenciaRaw[],
    ausencias:   AusenciaVista[],
    vacaciones:  VacacionesVista[]
  ): void {
    const wb = XLSX.utils.book_new();

    // Hoja 1 – Datos del empleado
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Campo',        'Valor'],
      ['Nombre',       empleado.nombre],
      ['Email',        empleado.email],
      ['DNI',          empleado.dni],
      ['Departamento', empleado.departamento],
      ['Puesto',       empleado.puesto],
      ['Rol empresa',  empleado.rolEmpresa],
      ['Fecha alta',   empleado.fechaAlta],
      ['Estado',       empleado.activo ? 'Activo' : 'Inactivo'],
    ]), 'Empleado');

    // Hoja 2 – Asistencia (último mes)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Fecha', 'Entrada', 'Salida', 'Horas', 'Modo'],
      ...asistencias.map(a => [
        a.fecha, a.entrada ?? '-', a.salida ?? '-', a.horas ?? '-', a.modo ?? '-'
      ]),
    ]), 'Asistencia (último mes)');

    // Hoja 3 – Ausencias
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Fecha inicio', 'Fecha fin', 'Días', 'Tipo', 'Estado', 'Motivo', 'Fecha solicitud'],
      ...ausencias.map(a => [
        a.fechaInicio, a.fechaFin, a.dias, a.tipo, a.estado, a.motivo ?? '', a.fechaSolicitud ?? ''
      ]),
    ]), 'Ausencias');

    // Hoja 4 – Vacaciones
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Fecha inicio', 'Fecha fin', 'Días', 'Estado'],
      ...vacaciones.map(v => [v.fechaInicio, v.fechaFin, v.dias, v.estado]),
    ]), 'Vacaciones');

    XLSX.writeFile(wb, `${this.nombreArchivo(empleado)}.xlsx`);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private csvVal(val: string): string {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }

  private nombreArchivo(empleado: Empleado): string {
    return empleado.nombre.trim().replace(/\s+/g, '_');
  }

  private descargarBlob(blob: Blob, nombreArchivo: string): void {
    const url    = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href     = url;
    enlace.download = nombreArchivo;
    enlace.click();
    URL.revokeObjectURL(url);
  }
}