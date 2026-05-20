export interface ComentarioAnuncio {
  id: string;
  autorId: string;
  autorNombre: string;
  autorFoto?: string;
  texto: string;
  respuestaAId?: string;
  respuestaAAutor?: string;
  respuestaATexto?: string;
  fecha: string;
}

export interface Anuncio {
  id?: string;
  titulo: string;
  contenido: string;
  categoria: 'IMPORTANTE' | 'GENERAL' | 'EVENTO' | 'URGENTE';
  autorId?: string;
  autorNombre?: string;
  imagenBase64?: string;
  fechaCreacion?: string;
  fechaExpiracion?: string | null;
  activo?: boolean;
  destacado: boolean;
  vistoPor?: string[];
  comentarios?: ComentarioAnuncio[];
}
