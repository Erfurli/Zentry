export interface Anuncio {
  id?: string;
  titulo: string;
  contenido: string;
  categoria: 'IMPORTANTE' | 'GENERAL' | 'EVENTO' | 'URGENTE';
  autorId?: string;
  autorNombre?: string;
  fechaCreacion?: string;
  fechaExpiracion?: string | null;
  activo?: boolean;
  destacado: boolean;
  vistoPor?: string[];
}