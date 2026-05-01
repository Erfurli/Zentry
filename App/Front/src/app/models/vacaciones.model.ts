export interface Vacaciones {
  id: string;
  empleadoId: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
}
