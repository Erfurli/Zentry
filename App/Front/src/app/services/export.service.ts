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

const cell       = (v: any, s: any) => ({ v, s, t: typeof v === 'number' ? 'n' : 's' });
const blank      = (s: any)         => ({ v: '', s });
const totalBlank = ()               => blank(ST.total());

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
    [cell(titulo, ST.title()),       ...Array(cols - 1).fill(null)],
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

function ensureTitleFit(colWidths: number[], titulo: string): number[] {
  const totalActual = colWidths.reduce((a, b) => a + b, 0);
  const minTotal = Math.ceil(titulo.length / 1.15) + 4;
  if (totalActual >= minTotal) return colWidths;
  const extra = minTotal - totalActual;
  return colWidths.map(w => w + Math.ceil((w / totalActual) * extra));
}

function makeSheet(
  rows: any[][], colWidths: number[], merges: any[],
  rowHeights?: number[], titulo = ''
): any {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;
  const adjustedCols = titulo ? ensureTitleFit(colWidths, titulo) : colWidths;
  ws['!cols'] = adjustedCols.map(w => ({ wch: w }));
  ws['!rows'] = rowHeights
    ? rowHeights.map(h => ({ hpt: h }))
    : [{ hpt: 42 }, { hpt: 22 }, { hpt: 8 }, { hpt: 24 },
       ...Array(Math.max(rows.length - 4, 1)).fill({ hpt: 22 })];
  return ws;
}

function descargar(wb: any, nombre: string): void {
  XLSX.writeFile(wb, nombre);
}

function makeResumen2Cols(rows: any[][], titulo: string): any {
  const minAncho = Math.ceil(titulo.length / 1.15) + 4;
  const colA = Math.max(26, Math.ceil(minAncho * 0.6));
  const colB = Math.max(18, minAncho - colA);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
  ];
  ws['!cols'] = [{ wch: colA }, { wch: colB }];
  ws['!rows'] = [{ hpt: 42 }, { hpt: 22 }, { hpt: 8 }, { hpt: 24 },
    ...Array(Math.max(rows.length - 4, 1)).fill({ hpt: 22 })];
  return ws;
}

@Injectable({ providedIn: 'root' })
export class ExportService {

  exportarAusenciasExcel(ausencias: AusenciaVista[], subtitulo = 'Todos los empleados'): void {
    const wb     = XLSX.utils.book_new();
    const COLS   = 9;
    const TITULO = 'ZENTRY · Ausencias';

    XLSX.utils.book_append_sheet(wb, this.buildResumenAusencias(ausencias), 'Resumen');

    const rows: any[][] = [
      ...headerRows(TITULO, subtitulo, COLS),
      ['Empleado','Departamento','Fecha inicio','Fecha fin','Días','Tipo','Estado','Motivo','Fecha solicitud']
        .map(h => cell(h, ST.colHeader())),
    ];

    if (ausencias.length === 0) {
      rows.push(emptyDataRow('Sin ausencias registradas', COLS));
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
          cell(a.motivo        ?? '',  ST.data(ev)),
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
      ...mergesHeader(COLS),
      ...(ausencias.length === 0 ? [{ s: { r: 4, c: 0 }, e: { r: 4, c: COLS - 1 } }] : []),
    ];

    const ws = makeSheet(rows, [20,14,13,13,7,16,14,22,16], merges, undefined, TITULO);
    XLSX.utils.book_append_sheet(wb, ws, 'Ausencias');
    descargar(wb, `Ausencias_${this.fecha()}.xlsx`);
  }

  exportarMisAusenciasExcel(ausencias: AusenciaVista[], nombreEmpleado: string): void {
    this.exportarAusenciasExcel(ausencias, nombreEmpleado);
  }

  private buildResumenAusencias(ausencias: AusenciaVista[]): any {
    const TITULO       = 'ZENTRY · Resumen de Ausencias';
    const justificadas   = ausencias.filter(a => a.estado === 'Justificada').length;
    const pendientes     = ausencias.filter(a => a.estado === 'Pendiente').length;
    const noJustificadas = ausencias.filter(a => a.estado === 'No Justificada').length;
    const totalDias      = ausencias.reduce((acc, a) => acc + (a.dias ?? 0), 0);

    return makeResumen2Cols([
      [cell(TITULO, ST.title()), null],
      [cell(this.fecha(), ST.subtitle()), null],
      [blank(ST.empty()), null],
      [cell('Indicador', ST.colHeader()), cell('Valor', ST.colHeader())],
      [cell('Total ausencias',  ST.field()),      cell(ausencias.length,  ST.data(false, true, C.primary))],
      [cell('Justificadas',     ST.field(true)),  cell(justificadas,      ST.badge(C.green_bg, C.green_fg))],
      [cell('Pendientes',       ST.field()),      cell(pendientes,        ST.badge(C.amber_bg, C.amber_fg))],
      [cell('No justificadas',  ST.field(true)),  cell(noJustificadas,    ST.badge(C.red_bg, C.red_fg))],
      [cell('Total días',       ST.field()),      cell(totalDias,         ST.data(false, true, C.primary))],
    ], TITULO);
  }

  exportarVacacionesExcel(vacaciones: VacacionesVista[], subtitulo = 'Todos los empleados'): void {
    const wb     = XLSX.utils.book_new();
    const COLS   = 6;
    const TITULO = 'ZENTRY · Vacaciones';

    XLSX.utils.book_append_sheet(wb, this.buildResumenVacaciones(vacaciones), 'Resumen');

    const rows: any[][] = [
      ...headerRows(TITULO, subtitulo, COLS),
      ['Empleado','Departamento','Fecha inicio','Fecha fin','Días','Estado']
        .map(h => cell(h, ST.colHeader())),
    ];

    if (vacaciones.length === 0) {
      rows.push(emptyDataRow('Sin vacaciones registradas', COLS));
    } else {
      vacaciones.forEach((v, i) => {
        const ev = i % 2 === 0;
        rows.push([
          cell(v.empleado,     ST.data(ev, true)),
          cell(v.departamento, ST.data(ev)),
          cell(v.fechaInicio,  ST.data(ev)),
          cell(v.fechaFin,     ST.data(ev)),
          cell(v.dias,         ST.data(ev, true, C.primary)),
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
      ...mergesHeader(COLS),
      ...(vacaciones.length === 0 ? [{ s: { r: 4, c: 0 }, e: { r: 4, c: COLS - 1 } }] : []),
    ];

    const ws = makeSheet(rows, [20,16,13,13,7,14], merges, undefined, TITULO);
    XLSX.utils.book_append_sheet(wb, ws, 'Vacaciones');
    descargar(wb, `Vacaciones_${this.fecha()}.xlsx`);
  }

  exportarMisVacacionesExcel(vacaciones: VacacionesVista[], nombreEmpleado: string): void {
    this.exportarVacacionesExcel(vacaciones, nombreEmpleado);
  }

  private buildResumenVacaciones(vacaciones: VacacionesVista[]): any {
    const TITULO     = 'ZENTRY · Resumen de Vacaciones';
    const aprobadas  = vacaciones.filter(v => v.estado === 'Aprobada').length;
    const pendientes = vacaciones.filter(v => v.estado === 'Pendiente').length;
    const rechazadas = vacaciones.filter(v => v.estado === 'Rechazada').length;
    const totalDias  = vacaciones.reduce((acc, v) => acc + (v.dias ?? 0), 0);

    return makeResumen2Cols([
      [cell(TITULO, ST.title()), null],
      [cell(this.fecha(), ST.subtitle()), null],
      [blank(ST.empty()), null],
      [cell('Indicador', ST.colHeader()), cell('Valor', ST.colHeader())],
      [cell('Total solicitudes', ST.field()),     cell(vacaciones.length, ST.data(false, true, C.primary))],
      [cell('Aprobadas',         ST.field(true)), cell(aprobadas,         ST.badge(C.green_bg, C.green_fg))],
      [cell('Pendientes',        ST.field()),     cell(pendientes,        ST.badge(C.amber_bg, C.amber_fg))],
      [cell('Rechazadas',        ST.field(true)), cell(rechazadas,        ST.badge(C.red_bg, C.red_fg))],
      [cell('Total días',        ST.field()),     cell(totalDias,         ST.data(false, true, C.primary))],
    ], TITULO);
  }

  exportarAsistenciaExcel(
    asistencias: AsistenciaVista[] | AsistenciaRaw[],
    subtitulo = 'Todos los empleados'
  ): void {
    const wb     = XLSX.utils.book_new();
    const COLS   = 8;
    const TITULO = 'ZENTRY · Asistencia';
    const lista  = asistencias as any[];

    XLSX.utils.book_append_sheet(wb, this.buildResumenAsistencia(lista), 'Resumen');

    const rows: any[][] = [
      ...headerRows(TITULO, subtitulo, COLS),
      ['Empleado','Departamento','Fecha','Entrada','Ini. Descanso','Fin Descanso','Salida','Horas','Extra','Estado']
        .map(h => cell(h, ST.colHeader())),
    ];

    if (lista.length === 0) {
      rows.push(emptyDataRow('Sin registros de asistencia', COLS + 2));
    } else {
      lista.forEach((a, i) => {
        const ev    = i % 2 === 0;
        const horas = a.horasTotales ?? a.horas ?? 0;
        const extra = a.horasExtra   ?? Math.max(0, horas - 8);
        rows.push([
          cell(a.nombre        ?? a.empleadoId ?? '', ST.data(ev, true)),
          cell(a.departamento  ?? '-',                 ST.data(ev)),
          cell(a.fecha         ?? '-',                 ST.data(ev)),
          cell(a.entrada       ?? '-',                 ST.data(ev)),
          cell(a.inicioDescanso ?? '-',                ST.data(ev)),
          cell(a.finDescanso    ?? '-',                ST.data(ev)),
          cell(a.salida         ?? '-',                ST.data(ev)),
          cell(horas,                                  ST.data(ev, true, C.primary)),
          extra > 0
            ? cell(`+${extra.toFixed ? extra.toFixed(1) : extra}h`, ST.badge(C.green_bg, C.green_fg))
            : cell('-', ST.data(ev)),
          a.estado ? estadoBadge(a.estado) : cell('-', ST.data(ev)),
        ]);
      });
      const totalHoras = lista.reduce((acc, a) => acc + (a.horasTotales ?? a.horas ?? 0), 0);
      rows.push([
        cell('TOTAL', ST.total()), totalBlank(), totalBlank(), totalBlank(),
        totalBlank(), totalBlank(), totalBlank(),
        cell(+totalHoras.toFixed(2), ST.total()),
        totalBlank(), totalBlank(),
      ]);
    }

    const merges = [
      ...mergesHeader(COLS + 2),
      ...(lista.length === 0 ? [{ s: { r: 4, c: 0 }, e: { r: 4, c: COLS + 1 } }] : []),
    ];

    const ws = makeSheet(rows, [20,14,12,10,13,12,10,8,8,14], merges, undefined, TITULO);
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
    descargar(wb, `Asistencia_${this.fecha()}.xlsx`);
  }

  private buildResumenAsistencia(lista: any[]): any {
    const TITULO     = 'ZENTRY · Resumen de Asistencia';
    const presentes  = lista.filter(a => ['Presente','TRABAJANDO','FINALIZADO','EN_DESCANSO'].includes(a.estado ?? '')).length;
    const retrasos   = lista.filter(a => a.estado === 'Retraso').length;
    const ausentes   = lista.filter(a => ['Ausente','NO_FICHADO'].includes(a.estado ?? '')).length;
    const totalHoras = lista.reduce((acc, a) => acc + (a.horasTotales ?? a.horas ?? 0), 0);
    const horasExtra = lista.reduce((acc, a) => acc + (a.horasExtra ?? 0), 0);

    return makeResumen2Cols([
      [cell(TITULO, ST.title()), null],
      [cell(this.fecha(), ST.subtitle()), null],
      [blank(ST.empty()), null],
      [cell('Indicador', ST.colHeader()), cell('Valor', ST.colHeader())],
      [cell('Total registros', ST.field()),     cell(lista.length,              ST.data(false, true, C.primary))],
      [cell('Presentes',       ST.field(true)), cell(presentes,                 ST.badge(C.green_bg, C.green_fg))],
      [cell('Con retraso',     ST.field()),     cell(retrasos,                  ST.badge(C.amber_bg, C.amber_fg))],
      [cell('Ausentes',        ST.field(true)), cell(ausentes,                  ST.badge(C.red_bg, C.red_fg))],
      [cell('Total horas',     ST.field()),     cell(+totalHoras.toFixed(2),    ST.data(false, true, C.primary))],
      [cell('Horas extra',     ST.field(true)), cell(+horasExtra.toFixed(2),    ST.badge(C.green_bg, C.green_fg))],
    ], TITULO);
  }

  exportarReporteAsistencia(datos: any[], subtitulo: string): void {
    this.exportarAsistenciaExcel(datos, subtitulo);
  }

  exportarReporteVacaciones(datos: any[], subtitulo: string): void {
    const vacaciones: VacacionesVista[] = datos.map(d => ({
      id:           '',
      empleadoId:   '',
      empleado:     d.empleado     ?? '',
      departamento: d.departamento ?? '',
      fechaInicio:  d.fechaInicio  ?? '',
      fechaFin:     d.fechaFin     ?? '',
      dias:         d.dias         ?? 0,
      estado:       d.estado       ?? '',
      motivo:       '',
    }));
    this.exportarVacacionesExcel(vacaciones, subtitulo);
  }

  exportarReporteAusencias(datos: any[], subtitulo: string): void {
    const ausencias: AusenciaVista[] = datos.map(d => ({
      id:              '',
      empleadoId:      '',
      empleado:        d.empleado     ?? '',
      departamento:    d.departamento ?? '',
      fechaInicio:     d.fechaInicio  ?? '',
      fechaFin:        d.fechaFin     ?? '',
      dias:            d.dias         ?? 0,
      tipo:            d.tipo         ?? '',
      estado:          d.estado       ?? '',
      motivo:          d.motivo       ?? '',
      fechaSolicitud:  '',
    }));
    this.exportarAusenciasExcel(ausencias, subtitulo);
  }

  exportarReportesExcel(reportes: any[], subtitulo = 'Panel de reportes'): void {
    const wb     = XLSX.utils.book_new();
    const COLS   = 7;
    const TITULO = 'ZENTRY · Reportes';

    const rows: any[][] = [
      ...headerRows(TITULO, subtitulo, COLS),
      ['Nombre','Tipo','Departamento','Periodo','Fecha generación','Registros','Estado']
        .map(h => cell(h, ST.colHeader())),
    ];

    if (reportes.length === 0) {
      rows.push(emptyDataRow('Sin reportes', COLS));
    } else {
      reportes.forEach((r, i) => {
        const ev = i % 2 === 0;
        rows.push([
          cell(r.nombre,          ST.data(ev, true)),
          tipoBadge(r.tipo),
          cell(r.departamento,    ST.data(ev)),
          cell(r.periodo,         ST.data(ev)),
          cell(r.fechaGeneracion, ST.data(ev)),
          cell(r.registros,       ST.data(ev, true, C.primary)),
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

    const ws = makeSheet(rows, [28,14,14,12,16,10,12], merges, undefined, TITULO);
    XLSX.utils.book_append_sheet(wb, ws, 'Reportes');
    descargar(wb, `Reportes_${this.fecha()}.xlsx`);
  }

  private fecha(): string {
    return new Date().toISOString().split('T')[0];
  }
}
