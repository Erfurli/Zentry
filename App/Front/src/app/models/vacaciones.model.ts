export interface Vacaciones {
  id: number;
  empleadoId: number;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
  fechaSolicitud: string;
}
