export interface Asistencia {
  id: number;
  empleadoId: number;
  fecha: string;
  entrada: string | null;
  salida: string | null;
  horas: number | null;
  modo: string;
}
