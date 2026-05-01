export interface AsistenciaVista {
  empleadoId: string;
  nombre: string;
  departamento: string;
  estado: 'Presente' | 'Ausente' | 'Retraso';
  entrada: string;
  salida: string;
  fecha: string;
}
