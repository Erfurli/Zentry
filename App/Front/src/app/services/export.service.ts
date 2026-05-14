import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx-js-style';
import { AusenciaVista } from './ausencias.service';
import { VacacionesVista } from './vacaciones.service';
import { AsistenciaRaw } from './asistencia.service';
import { AsistenciaVista } from '../models/asistencia.model';

const C = {
  primary:   '3A5698',
  dark:      '203055',
  white:     'FFFFFF',
  gray50:    'FAFAFA',
  gray700:   '374151',
  green_bg:  'D1FAE5', green_fg:  '065F46',
  blue_bg:   'DBEAFE', blue_fg:   '1E40AF',
  amber_bg:  'FEF3C7', amber_fg:  '92400E',
  red_bg:    'FEE2E2', red_fg:    '991B1B',
  purple_bg: 'EDE9FE', purple_fg: '5B21B6',
};

const border = (color = 'E5E7EB') => ({
  top:    { style: 'thin', color: { rgb: color } },
  bottom: { style: 'thin', color: { rgb: color } },
  left:   { style: 'thin', color: { rgb: color } },
  right:  { style: 'thin', color: { rgb: color } },
});

const ST = {
  title: (): any => ({
    font:      { name: 'Arial', sz: 16, bold: true, color: { rgb: C.white } },
    fill:      { fgColor: { rgb: C.primary } },
    alignment: { horizontal: 'center', vertical: 'center' },
  }),
  subtitle: (): any => ({
    font:      { name: 'Arial', sz: 10, bold: true, color: { rgb: C.white } },
    fill:      { fgColor: { rgb: C.dark } },
    alignment: { horizontal: 'center', vertical: 'center' },
  }),
  colHeader: (): any => ({
    font:      { name: 'Arial', sz: 10, bold: true, color: { rgb: C.white } },
    fill:      { fgColor: { rgb: C.dark } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border:    border(C.primary),
  }),
  field: (isEven = false): any => ({
    font:      { name: 'Arial', sz: 10, bold: true, color: { rgb: C.primary } },
    fill:      { fgColor: { rgb: isEven ? C.gray50 : C.white } },
    alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
    border:    border(),
  }),
  data: (isEven = false, bold = false, color?: string): any => ({
    font:      { name: 'Arial', sz: 10, bold, color: { rgb: color || C.gray700 } },
    fill:      { fgColor: { rgb: isEven ? C.gray50 : C.white } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border:    border(),
  }),
  badge: (bg: string, fg: string): any => ({
    font:      { name: 'Arial', sz: 9, bold: true, color: { rgb: fg } },
    fill:      { fgColor: { rgb: bg } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border:    border(),
  }),
  total: (): any => ({
    font:      { name: 'Arial', sz: 10, bold: true, color: { rgb: C.white } },
    fill:      { fgColor: { rgb: C.primary } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border:    border(C.dark),
  }),
  empty: (isEven = false): any => ({
    fill:   { fgColor: { rgb: isEven ? C.gray50 : C.white } },
    border: border(),
  }),
};

const cell  = (v: any, s: any) => ({ v, s, t: typeof v === 'number' ? 'n' : 's' });
const blank = (s: any)         => ({ v: '', s });
const totalBlank = ()          => blank(ST.total());

function estadoBadge(estado: string): any {
  const lower = (estado ?? '').toLowerCase();
  if (['aprobada','justificada','activo','generado'].includes(lower))
    return cell(estado, ST.badge(C.green_bg, C.green_fg));
  if (['pendiente'].includes(lower))
    return cell(estado, ST.badge(C.amber_bg, C.amber_fg));
  if (['rechazada','no justificada','inactivo','error'].includes(lower))
    return cell(estado, ST.badge(C.red_bg, C.red_fg));
  return cell(estado, ST.data());
}

function tipoBadge(tipo: string): any {
  return cell(tipo, ST.badge(C.blue_bg, C.blue_fg));
}

function emptyRow(cols: number, isEven = false): any[] {
  return Array(cols).fill(null).map(() => blank(ST.empty(isEven)));
}

function headerRows(titulo: string, subtitulo: string, cols: number): any[][] {
  return [
    [cell(titulo, ST.title()),    ...Array(cols - 1).fill(null)],
    [cell(subtitulo, ST.subtitle()), ...Array(cols - 1).fill(null)],
    emptyRow(cols),
  ];
}

function mergesHeader(cols: number): any[] {
  return [
    { s: { r: 0, c: 0 }, e: { r: 0, c: cols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: cols - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: cols - 1 } },
  ];
}

function emptyDataRow(texto: string, cols: number): any[] {
  return [
    cell(texto, {
      font:      { name: 'Arial', sz: 10, italic: true, color: { rgb: '94A3B8' } },
      fill:      { fgColor: { rgb: C.gray50 } },
      alignment: { horizontal: 'center', vertical: 'center' },
    }),
    ...Array(cols - 1).fill(null),
  ];
}

function makeSheet(rows: any[][], cols: number[], merges: any[], rowHeights?: number[]): any {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;
  ws['!cols']   = cols.map(w => ({ wch: w }));
  ws['!rows']   = rowHeights
    ? rowHeights.map(h => ({ hpt: h }))
    : [{ hpt: 42 }, { hpt: 22 }, { hpt: 8 }, { hpt: 24 },
       ...Array(Math.max(rows.length - 4, 1)).fill({ hpt: 22 })];
  return ws;
}

function descargar(wb: any, nombre: string): void {
  XLSX.writeFile(wb, nombre);
}

@Injectable({ providedIn: 'root' })
export class ExportService {


  exportarAusenciasExcel(ausencias: AusenciaVista[], subtitulo = 'Todos los empleados'): void {
    const wb   = XLSX.utils.book_new();
    const COLS = 7;
    const headers = ['Empleado', 'Departamento', 'Fecha inicio', 'Fecha fin',
                     'Días', 'Tipo', 'Estado', 'Motivo', 'Fecha solicitud'];

    const resumen = this.buildResumenAusencias(ausencias);
    XLSX.utils.book_append_sheet(wb, resumen, 'Resumen');

    const rows: any[][] = [
      ...headerRows('ZENTRY · Ausencias', subtitulo, COLS + 2),
      headers.map(h => cell(h, ST.colHeader())),
    ];

    if (ausencias.length === 0) {
      rows.push(emptyDataRow('Sin ausencias registradas', COLS + 2));
    } else {
      ausencias.forEach((a, i) => {
        const ev = i % 2 === 0;
        rows.push([
          cell(a.empleado,             ST.data(ev, true)),
          cell(a.departamento,         ST.data(ev)),
          cell(a.fechaInicio,          ST.data(ev)),
          cell(a.fechaFin,             ST.data(ev)),
          cell(a.dias,                 ST.data(ev, true, C.primary)),
          tipoBadge(a.tipo),
          estadoBadge(a.estado),
          cell(a.motivo ?? '',         ST.data(ev)),
          cell(a.fechaSolicitud ?? '', ST.data(ev)),
        ]);
      });

      const totalDias = ausencias.reduce((acc, a) => acc + (a.dias ?? 0), 0);
      rows.push([
        cell('TOTAL', ST.total()), totalBlank(), totalBlank(), totalBlank(),
        cell(totalDias, ST.total()),
        totalBlank(), totalBlank(), totalBlank(), totalBlank(),
      ]);
    }

    const merges = [
      ...mergesHeader(COLS + 2),
      ...(ausencias.length === 0 ? [{ s: { r: 4, c: 0 }, e: { r: 4, c: COLS + 1 } }] : []),
    ];

    const ws = makeSheet(rows, [18, 14, 13, 13, 7, 16, 14, 22, 16], merges);
    XLSX.utils.book_append_sheet(wb, ws, 'Ausencias');
    descargar(wb, `Ausencias_${this.fecha()}.xlsx`);
  }

  exportarMisAusenciasExcel(ausencias: AusenciaVista[], nombreEmpleado: string): void {
    this.exportarAusenciasExcel(ausencias, nombreEmpleado);
  }

  private buildResumenAusencias(ausencias: AusenciaVista[]): any {
    const justificadas   = ausencias.filter(a => a.estado === 'Justificada').length;
    const pendientes     = ausencias.filter(a => a.estado === 'Pendiente').length;
    const noJustificadas = ausencias.filter(a => a.estado === 'No Justificada').length;
    const totalDias      = ausencias.reduce((acc, a) => acc + (a.dias ?? 0), 0);

    const rows: any[][] = [
      [cell('ZENTRY · Resumen de Ausencias', ST.title()), null],
      [cell(this.fecha(), ST.subtitle()), null],
      [blank(ST.empty()), null],
      [cell('Indicador', ST.colHeader()), cell('Valor', ST.colHeader())],
      [cell('Total ausencias',    ST.field()),  cell(ausencias.length, ST.data(false, true, C.primary))],
      [cell('Justificadas',       ST.field(true)), cell(justificadas,   ST.badge(C.green_bg, C.green_fg))],
      [cell('Pendientes',         ST.field()),  cell(pendientes,        ST.badge(C.amber_bg, C.amber_fg))],
      [cell('No justificadas',    ST.field(true)), cell(noJustificadas, ST.badge(C.red_bg,   C.red_fg))],
      [cell('Total días',         ST.field()),  cell(totalDias,         ST.data(false, true, C.primary))],
    ];

    const ws = makeSheet(rows, [24, 16], [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
    ]);
    return ws;
  }


  exportarVacacionesExcel(vacaciones: VacacionesVista[], subtitulo = 'Todos los empleados'): void {
    const wb   = XLSX.utils.book_new();
    const COLS = 5;

    XLSX.utils.book_append_sheet(wb, this.buildResumenVacaciones(vacaciones), 'Resumen');

    const rows: any[][] = [
      ...headerRows('ZENTRY · Vacaciones', subtitulo, COLS),
      ['Empleado', 'Departamento', 'Fecha inicio', 'Fecha fin', 'Días', 'Estado']
        .map(h => cell(h, ST.colHeader())),
    ];

    if (vacaciones.length === 0) {
      rows.push(emptyDataRow('Sin vacaciones registradas', COLS));
    } else {
      vacaciones.forEach((v, i) => {
        const ev = i % 2 === 0;
        rows.push([
          cell(v.empleado,    ST.data(ev, true)),
          cell(v.departamento,ST.data(ev)),
          cell(v.fechaInicio, ST.data(ev)),
          cell(v.fechaFin,    ST.data(ev)),
          cell(v.dias,        ST.data(ev, true, C.primary)),
          estadoBadge(v.estado),
        ]);
      });

      const totalDias = vacaciones.reduce((acc, v) => acc + (v.dias ?? 0), 0);
      rows.push([
        cell('TOTAL', ST.total()), totalBlank(), totalBlank(), totalBlank(),
        cell(totalDias, ST.total()), totalBlank(),
      ]);
    }

    const merges = [
      ...mergesHeader(COLS + 1),
      ...(vacaciones.length === 0 ? [{ s: { r: 4, c: 0 }, e: { r: 4, c: COLS } }] : []),
    ];

    const ws = makeSheet(rows, [18, 14, 13, 13, 7, 12], merges);
    XLSX.utils.book_append_sheet(wb, ws, 'Vacaciones');
    descargar(wb, `Vacaciones_${this.fecha()}.xlsx`);
  }

  exportarMisVacacionesExcel(vacaciones: VacacionesVista[], nombreEmpleado: string): void {
    this.exportarVacacionesExcel(vacaciones, nombreEmpleado);
  }

  private buildResumenVacaciones(vacaciones: VacacionesVista[]): any {
    const aprobadas  = vacaciones.filter(v => v.estado === 'Aprobada').length;
    const pendientes = vacaciones.filter(v => v.estado === 'Pendiente').length;
    const rechazadas = vacaciones.filter(v => v.estado === 'Rechazada').length;
    const totalDias  = vacaciones.reduce((acc, v) => acc + (v.dias ?? 0), 0);

    const rows: any[][] = [
      [cell('ZENTRY · Resumen de Vacaciones', ST.title()), null],
      [cell(this.fecha(), ST.subtitle()), null],
      [blank(ST.empty()), null],
      [cell('Indicador', ST.colHeader()), cell('Valor', ST.colHeader())],
      [cell('Total solicitudes', ST.field()),       cell(vacaciones.length, ST.data(false, true, C.primary))],
      [cell('Aprobadas',         ST.field(true)),   cell(aprobadas,  ST.badge(C.green_bg, C.green_fg))],
      [cell('Pendientes',        ST.field()),        cell(pendientes, ST.badge(C.amber_bg, C.amber_fg))],
      [cell('Rechazadas',        ST.field(true)),   cell(rechazadas, ST.badge(C.red_bg,   C.red_fg))],
      [cell('Total días',        ST.field()),        cell(totalDias,  ST.data(false, true, C.primary))],
    ];

    const ws = makeSheet(rows, [24, 16], [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
    ]);
    return ws;
  }


  exportarAsistenciaExcel(
    asistencias: AsistenciaVista[] | AsistenciaRaw[],
    subtitulo = 'Todos los empleados'
  ): void {
    const wb   = XLSX.utils.book_new();
    const COLS = 7;

    // XLSX.utils.book_append_sheet(wb, this.buildResumenAsistencia(asistencias as any[]), 'Resumen');
    XLSX.utils.book_append_sheet(wb, this.buildResumenAusencias(asistencias as any[]), 'Resumen');

    const rows: any[][] = [
      ...headerRows('ZENTRY · Asistencia', subtitulo, COLS),
      ['Empleado/Fecha', 'Entrada', 'Descanso inicio', 'Descanso fin',
       'Salida', 'Horas', 'Estado/Modo'].map(h => cell(h, ST.colHeader())),
    ];

    const lista = asistencias as any[];
    if (lista.length === 0) {
      rows.push(emptyDataRow('Sin registros de asistencia', COLS));
    } else {
      lista.forEach((a, i) => {
        const ev    = i % 2 === 0;
        const label = (a as any).nombre ?? (a as any).fecha ?? '';
        const horas = (a as any).horasTotales ?? (a as any).horas ?? 0;
        const extra = horas - 8;

        rows.push([
          cell(label,                      ST.data(ev, true)),
          cell(a.entrada ?? '-',           ST.data(ev)),
          cell((a as any).inicioDescanso ?? '-', ST.data(ev)),
          cell((a as any).finDescanso ?? '-',    ST.data(ev)),
          cell(a.salida ?? '-',            ST.data(ev)),
          cell(horas,                      ST.data(ev, true, C.primary)),
          (a as any).estado
            ? estadoBadge((a as any).estado)
            : extra > 0
              ? cell(`+${extra.toFixed(1)}h extra`, ST.badge(C.green_bg, C.green_fg))
              : cell((a as any).modo ?? '-', ST.data(ev)),
        ]);
      });

      const totalHoras = lista.reduce((acc, a) => acc + ((a as any).horasTotales ?? (a as any).horas ?? 0), 0);
      rows.push([
        cell('TOTAL', ST.total()), totalBlank(), totalBlank(), totalBlank(), totalBlank(),
        cell(+totalHoras.toFixed(2), ST.total()), totalBlank(),
      ]);
    }

    const merges = [
      ...mergesHeader(COLS),
      ...(lista.length === 0 ? [{ s: { r: 4, c: 0 }, e: { r: 4, c: COLS - 1 } }] : []),
    ];

    const ws = makeSheet(rows, [18, 10, 15, 13, 10, 8, 16], merges);
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
    descargar(wb, `Asistencia_${this.fecha()}.xlsx`);
  }


  exportarReportesExcel(reportes: any[], subtitulo = 'Panel de reportes'): void {
    const wb   = XLSX.utils.book_new();
    const COLS = 7;

    const rows: any[][] = [
      ...headerRows('ZENTRY · Reportes', subtitulo, COLS),
      ['Nombre', 'Tipo', 'Departamento', 'Periodo', 'Fecha generación', 'Registros', 'Estado']
        .map(h => cell(h, ST.colHeader())),
    ];

    if (reportes.length === 0) {
      rows.push(emptyDataRow('Sin reportes', COLS));
    } else {
      reportes.forEach((r, i) => {
        const ev = i % 2 === 0;
        rows.push([
          cell(r.nombre,           ST.data(ev, true)),
          tipoBadge(r.tipo),
          cell(r.departamento,     ST.data(ev)),
          cell(r.periodo,          ST.data(ev)),
          cell(r.fechaGeneracion,  ST.data(ev)),
          cell(r.registros,        ST.data(ev, true, C.primary)),
          estadoBadge(r.estado),
        ]);
      });

      const totalRegistros = reportes.reduce((acc, r) => acc + (r.registros ?? 0), 0);
      rows.push([
        cell('TOTAL', ST.total()), totalBlank(), totalBlank(), totalBlank(), totalBlank(),
        cell(totalRegistros, ST.total()), totalBlank(),
      ]);
    }

    const merges = [
      ...mergesHeader(COLS),
      ...(reportes.length === 0 ? [{ s: { r: 4, c: 0 }, e: { r: 4, c: COLS - 1 } }] : []),
    ];

    const ws = makeSheet(rows, [28, 14, 14, 12, 16, 10, 12], merges);
    XLSX.utils.book_append_sheet(wb, ws, 'Reportes');
    descargar(wb, `Reportes_${this.fecha()}.xlsx`);
  }


  private fecha(): string {
    return new Date().toISOString().split('T')[0];
  }
}
