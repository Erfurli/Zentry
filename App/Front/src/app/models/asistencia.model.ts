export type EstadoAsistencia = 'NO_FICHADO' | 'TRABAJANDO' | 'EN_DESCANSO' | 'FINALIZADO';

export interface AsistenciaVista {
  empleadoId: string;
  nombre: string;
  departamento: string;
  estado: 'Presente' | 'Ausente' | 'Retraso' | EstadoAsistencia;
  entrada: string;
  salida: string;
  fecha: string;
  inicioDescanso?: string | null;
  finDescanso?: string | null;
  horasTrabajo?: number | null;
  horasDescanso?: number | null;
  horasTotales?: number | null;
  horasExtra?: number | null;
  modo?: string | null;
}

export interface AsistenciaHoy {
  id?: string;
  empleadoId: string;
  fecha: string;
  estado: EstadoAsistencia;
  entrada?: string | null;
  inicioDescanso?: string | null;
  finDescanso?: string | null;
  salida?: string | null;
  horasTrabajo?: number | null;
  horasDescanso?: number | null;
  horasTotales?: number | null;
  horasExtra?: number | null;
  modo?: string | null;
  observaciones?: string | null;
}
