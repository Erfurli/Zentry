export type EstadoAsistencia =
  | 'NO_FICHADO'
  | 'TRABAJANDO'
  | 'EN_DESCANSO'
  | 'FINALIZADO'
  | 'Presente'
  | 'Retraso'
  | 'Ausente';

export interface AsistenciaHoy {
  id?: string;
  empleadoId: string;
  nombre: string;
  departamento: string;
  estado: EstadoAsistencia;
  entrada?: string | null;
  salida?: string | null;
  inicioDescanso?: string | null;
  finDescanso?: string | null;
  horasTotales?: number;
  horasExtra?: number;
  fecha: string;
}

export type AsistenciaVista = AsistenciaHoy;
