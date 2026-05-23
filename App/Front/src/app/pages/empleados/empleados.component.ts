import {
  Component, ChangeDetectionStrategy, computed, inject, OnInit, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx-js-style';

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
  imports: [CommonModule, RouterLink, FormsModule, EmpleadoModalComponent],
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

  readonly modalExportarAbierto  = signal(false);
  readonly empleadoExportando    = signal<Empleado | undefined>(undefined);
  readonly formatoExportar       = signal<'csv' | 'excel'>('csv');
  readonly exportando            = signal(false);

  readonly modalEstructuraAdminAbierto = signal(false);
  readonly empleadoEstructuraSeleccionado = signal<Empleado | null>(null);
  departamentoEstructuraInput: string = '';
  esMandoEstructuraInput: boolean = false;

  readonly todosLosEmpleados = computed(() => this.empleados());

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

  readonly modalEliminarAbierto = signal(false);
readonly empleadoEliminando = signal<Empleado | undefined>(undefined);

abrirModalEliminar(empleado: Empleado): void {
  this.empleadoEliminando.set(empleado);
  this.modalEliminarAbierto.set(true);
}

cerrarModalEliminar(): void {
  this.modalEliminarAbierto.set(false);
  this.empleadoEliminando.set(undefined);
}

confirmarEliminar(): void {
  const empleado = this.empleadoEliminando();
  if (!empleado) return;
  this.empleadosService.eliminarEmpleado(empleado.id).subscribe({
    next: () => {
      this.empleados.update(lista => lista.filter(e => e.id !== empleado.id));
      this.cerrarModalEliminar();
    },
    error: err => console.error('Error deleting employee', err)
  });
}

  eliminarEmpleado(id: string): void {
    if (!confirm('¿Estás seguro de que quieres eliminar este empleado?')) return;
    this.empleadosService.eliminarEmpleado(id).subscribe({
      next: () => {
        this.empleados.update(lista => lista.filter(e => e.id !== id));
      },
      error: err => console.error('Error deleting employee', err)
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

  abrirModalInfo(empleado: Empleado): void {
    this.empleadoInfo.set(empleado);
    this.modalInfoAbierto.set(true);
  }

  cerrarModalInfo(): void {
    this.modalInfoAbierto.set(false);
    this.empleadoInfo.set(undefined);
  }

  abrirModalEstructuraAdmin(): void {
    this.modalEstructuraAdminAbierto.set(true);
    this.empleadoEstructuraSeleccionado.set(null);
    this.departamentoEstructuraInput = '';
    this.esMandoEstructuraInput = false;
  }

  cerrarModalEstructuraAdmin(): void {
    this.modalEstructuraAdminAbierto.set(false);
    this.empleadoEstructuraSeleccionado.set(null);
  }

  onEmpleadoEstructuraSeleccionado(event: Event): void {
    const empleadoId = (event.target as HTMLSelectElement).value;
    if (!empleadoId) {
      this.empleadoEstructuraSeleccionado.set(null);
      return;
    }
    const empleado = this.empleados().find(e => e.id === empleadoId);
    if (empleado) {
      this.empleadoEstructuraSeleccionado.set(empleado);
      this.departamentoEstructuraInput = empleado.departamento || '';
      this.esMandoEstructuraInput = empleado.rolEmpresa === 'MANDO';
    }
  }

  guardarCambiosEstructuraAdmin(): void {
    const empleadoActual = this.empleadoEstructuraSeleccionado();
    if (!empleadoActual) return;

    const copiaEmpleado = { ...empleadoActual };
    copiaEmpleado.departamento = this.departamentoEstructuraInput;
    copiaEmpleado.rolEmpresa = this.esMandoEstructuraInput ? 'MANDO' : 'EMPLEADO';

    this.empleadosService.actualizarEmpleado(empleadoActual.id, copiaEmpleado).subscribe({
      next: (empleadoActualizado) => {
        this.empleados.update(lista =>
          lista.map(e => e.id === empleadoActualizado.id ? empleadoActualizado : e)
        );
        this.cerrarModalEstructuraAdmin();
      },
      error: (err) => console.error('Error updating structure', err)
    });
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
        console.error('Error exporting data', err);
        this.exportando.set(false);
      },
    });
  }

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

  private exportarExcel(
    empleado:    Empleado,
    asistencias: AsistenciaRaw[],
    ausencias:   AusenciaVista[],
    vacaciones:  VacacionesVista[]
  ): void {
    const C = {
      primary:  '3A5698',
      dark:     '203055',
      white:    'FFFFFF',
      gray50:   'FAFAFA',
      gray100:  'F5F5F5',
      gray200:  'E5E7EB',
      gray700:  '374151',
      green_bg: 'D1FAE5', green_fg: '065F46',
      blue_bg:  'DBEAFE', blue_fg:  '1E40AF',
      amber_bg: 'FEF3C7', amber_fg: '92400E',
      red_bg:   'FEE2E2', red_fg:   '991B1B',
    };

    const thinBorder = (color = 'E5E7EB') => ({
      top:    { style: 'thin', color: { rgb: color } },
      bottom: { style: 'thin', color: { rgb: color } },
      left:   { style: 'thin', color: { rgb: color } },
      right:  { style: 'thin', color: { rgb: color } },
    });

    const styleTitle = (): any => ({
      font:      { name: 'Arial', sz: 16, bold: true, color: { rgb: C.white } },
      fill:      { fgColor: { rgb: C.primary } },
      alignment: { horizontal: 'center', vertical: 'center' },
    });

    const styleSubtitle = (): any => ({
      font:      { name: 'Arial', sz: 10, bold: true, color: { rgb: C.white } },
      fill:      { fgColor: { rgb: C.dark } },
      alignment: { horizontal: 'center', vertical: 'center' },
    });

    const styleColHeader = (): any => ({
      font:      { name: 'Arial', sz: 10, bold: true, color: { rgb: C.white } },
      fill:      { fgColor: { rgb: C.dark } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border:    thinBorder(C.primary),
    });

    const styleField = (bold = false, isEven = false): any => ({
      font:      { name: 'Arial', sz: 10, bold, color: { rgb: bold ? C.primary : C.gray700 } },
      fill:      { fgColor: { rgb: isEven ? C.gray50 : C.white } },
      alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
      border:    thinBorder(),
    });

    const styleData = (isEven = false, bold = false, color?: string): any => ({
      font:      { name: 'Arial', sz: 10, bold, color: { rgb: color || C.gray700 } },
      fill:      { fgColor: { rgb: isEven ? C.gray50 : C.white } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border:    thinBorder(),
    });

    const styleBadge = (bg: string, fg: string): any => ({
      font:      { name: 'Arial', sz: 9, bold: true, color: { rgb: fg } },
      fill:      { fgColor: { rgb: bg } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border:    thinBorder(),
    });

    const styleTotal = (): any => ({
      font:      { name: 'Arial', sz: 10, bold: true, color: { rgb: C.white } },
      fill:      { fgColor: { rgb: C.primary } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border:    thinBorder(C.dark),
    });

    const s = (v: any, style: any) => ({ v, s: style, t: typeof v === 'number' ? 'n' : 's' });
    const empty = (isEven = false) => s('', { fill: { fgColor: { rgb: isEven ? C.gray50 : C.white } }, border: thinBorder() });
    const totalEmpty = () => s('', styleTotal());

    const estadoBadge = (estado: string) => {
      if (!estado) return s('-', styleData());
      const lower = estado.toLowerCase();
      if (lower === 'aprobada' || lower === 'activo')    return s(estado, styleBadge(C.green_bg, C.green_fg));
      if (lower === 'pendiente')                          return s(estado, styleBadge(C.amber_bg, C.amber_fg));
      if (lower === 'rechazada' || lower === 'inactivo') return s(estado, styleBadge(C.red_bg,   C.red_fg));
      return s(estado, styleData());
    };

    const wb = XLSX.utils.book_new();

    const datosEmp = [
      ['Nombre',       empleado.nombre],
      ['Email',        empleado.email],
      ['DNI',          empleado.dni],
      ['Departamento', empleado.departamento],
      ['Puesto',       empleado.puesto],
      ['Rol empresa',  empleado.rolEmpresa],
      ['Fecha alta',   empleado.fechaAlta],
      ['Estado',       empleado.activo ? 'Activo' : 'Inactivo'],
    ];

    const ws1Rows: any[][] = [
      [s(`ZENTRY · Informe de Empleado`, styleTitle()), null],
      [s('Datos personales y laborales', styleSubtitle()), null],
      [{ v: '', s: { fill: { fgColor: { rgb: C.white } } } }, null],
      [s('Campo', styleColHeader()), s('Valor', styleColHeader())],
    ];

    datosEmp.forEach(([campo, valor], i) => {
      const isEven = i % 2 === 0;
      let valorCell: any;
      if (campo === 'Estado')
        valorCell = estadoBadge(valor as string);
      else if (campo === 'Rol empresa')
        valorCell = s(valor, styleBadge(C.blue_bg, C.blue_fg));
      else
        valorCell = s(valor, styleData(isEven));

      ws1Rows.push([s(campo, styleField(true, isEven)), valorCell]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(ws1Rows);
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
      ...datosEmp.map((_, i) => ({ s: { r: i + 4, c: 1 }, e: { r: i + 4, c: 1 } })),
    ];
    ws1['!cols'] = [{ wch: 20 }, { wch: 36 }];
    ws1['!rows'] = [{ hpt: 42 }, { hpt: 22 }, { hpt: 8 }, { hpt: 24 },
      ...datosEmp.map(() => ({ hpt: 22 }))];
    XLSX.utils.book_append_sheet(wb, ws1, 'Empleado');

    const totalHoras = asistencias.reduce((acc, a) => acc + (a.horas ?? 0), 0);

    const ws2Rows: any[][] = [
      [s('ZENTRY · Registro de Asistencia', styleTitle()), null, null, null, null, null],
      [s(`Último mes · ${empleado.nombre}`, styleSubtitle()), null, null, null, null, null],
      [{ v: '', s: {} }, null, null, null, null, null],
      ['Fecha', 'Entrada', 'Salida', 'Horas', 'Extra', 'Modo'].map(h => s(h, styleColHeader())),
    ];

    if (asistencias.length === 0) {
      ws2Rows.push([s('Sin registros en el último mes', {
        font: { name: 'Arial', sz: 10, italic: true, color: { rgb: '94A3B8' } },
        fill: { fgColor: { rgb: C.gray50 } },
        alignment: { horizontal: 'center', vertical: 'center' },
      }), null, null, null, null, null]);
    } else {
      asistencias.forEach((a, i) => {
        const ev = i % 2 === 0;
        const extra = (a.horas ?? 0) - 8;
        ws2Rows.push([
          s(a.fecha,          styleData(ev)),
          s(a.entrada ?? '-', styleData(ev)),
          s(a.salida  ?? '-', styleData(ev)),
          s(a.horas   ?? 0,   styleData(ev, true, C.primary)),
          extra > 0
            ? s(`+${extra.toFixed(1)}h`, styleBadge(C.green_bg, C.green_fg))
            : s('–',                      styleData(ev)),
          a.modo === 'REMOTO'
            ? s(a.modo, styleBadge(C.amber_bg, C.amber_fg))
            : s(a.modo ?? 'Presencial', styleBadge(C.blue_bg, C.blue_fg)),
        ]);
      });
    }

    ws2Rows.push([
      s('TOTAL', styleTotal()),
      totalEmpty(), totalEmpty(),
      s(+totalHoras.toFixed(2), styleTotal()),
      totalEmpty(), totalEmpty(),
    ]);

    const ws2 = XLSX.utils.aoa_to_sheet(ws2Rows);
    const dataRowCount = Math.max(asistencias.length, 1);
    ws2['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
      ...(asistencias.length === 0
        ? [{ s: { r: 4, c: 0 }, e: { r: 4, c: 5 } }]
        : []),
    ];
    ws2['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 14 }];
    ws2['!rows'] = [{ hpt: 42 }, { hpt: 22 }, { hpt: 8 }, { hpt: 24 },
      ...Array(dataRowCount + 1).fill({ hpt: 22 })];
    XLSX.utils.book_append_sheet(wb, ws2, 'Asistencia (último mes)');

    const ws3Rows: any[][] = [
      [s('ZENTRY · Registro de Ausencias', styleTitle()), null, null, null, null, null, null],
      [s(empleado.nombre, styleSubtitle()), null, null, null, null, null, null],
      [{ v: '', s: {} }, null, null, null, null, null, null],
      ['Fecha inicio','Fecha fin','Días','Tipo','Estado','Motivo','Fecha solicitud'].map(h => s(h, styleColHeader())),
    ];

    if (ausencias.length === 0) {
      ws3Rows.push([s('Sin ausencias registradas', {
        font: { name: 'Arial', sz: 10, italic: true, color: { rgb: '94A3B8' } },
        fill: { fgColor: { rgb: C.gray50 } },
        alignment: { horizontal: 'center', vertical: 'center' },
      }), null, null, null, null, null, null]);
    } else {
      ausencias.forEach((a, i) => {
        const ev = i % 2 === 0;
        ws3Rows.push([
          s(a.fechaInicio,           styleData(ev)),
          s(a.fechaFin,              styleData(ev)),
          s(a.dias,                  styleData(ev, true)),
          s(a.tipo,                  styleData(ev)),
          estadoBadge(a.estado),
          s(a.motivo ?? '',          styleData(ev)),
          s(a.fechaSolicitud ?? '',  styleData(ev)),
        ]);
      });
    }

    const ws3 = XLSX.utils.aoa_to_sheet(ws3Rows);
    ws3['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
      ...(ausencias.length === 0 ? [{ s: { r: 4, c: 0 }, e: { r: 4, c: 6 } }] : []),
    ];
    ws3['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 16 }];
    ws3['!rows'] = [{ hpt: 42 }, { hpt: 22 }, { hpt: 8 }, { hpt: 24 },
      ...Array(Math.max(ausencias.length, 1)).fill({ hpt: 22 })];
    XLSX.utils.book_append_sheet(wb, ws3, 'Ausencias');

    const totalDiasVac = vacaciones.reduce((acc, v) => acc + (v.dias ?? 0), 0);

    const ws4Rows: any[][] = [
      [s('ZENTRY · Registro de Vacaciones', styleTitle()), null, null, null],
      [s(empleado.nombre, styleSubtitle()), null, null, null],
      [{ v: '', s: {} }, null, null, null],
      ['Fecha inicio', 'Fecha fin', 'Días', 'Estado'].map(h => s(h, styleColHeader())),
    ];

    if (vacaciones.length === 0) {
      ws4Rows.push([s('Sin vacaciones registradas', {
        font: { name: 'Arial', sz: 10, italic: true, color: { rgb: '94A3B8' } },
        fill: { fgColor: { rgb: C.gray50 } },
        alignment: { horizontal: 'center', vertical: 'center' },
      }), null, null, null]);
    } else {
      vacaciones.forEach((v, i) => {
        const ev = i % 2 === 0;
        ws4Rows.push([
          s(v.fechaInicio, styleData(ev)),
          s(v.fechaFin,    styleData(ev)),
          s(v.dias,        styleData(ev, true)),
          estadoBadge(v.estado),
        ]);
      });
    }

    ws4Rows.push([
      s('TOTAL DÍAS', styleTotal()),
      totalEmpty(),
      s(totalDiasVac, styleTotal()),
      totalEmpty(),
    ]);

    const ws4 = XLSX.utils.aoa_to_sheet(ws4Rows);
    const vacRowCount = Math.max(vacaciones.length, 1);
    ws4['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
      ...(vacaciones.length === 0 ? [{ s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }] : []),
    ];
    ws4['!cols'] = [{ wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 14 }];
    ws4['!rows'] = [{ hpt: 42 }, { hpt: 22 }, { hpt: 8 }, { hpt: 24 },
      ...Array(vacRowCount + 1).fill({ hpt: 22 })];
    XLSX.utils.book_append_sheet(wb, ws4, 'Vacaciones');

    XLSX.writeFile(wb, `${this.nombreArchivo(empleado)}.xlsx`);
  }

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
