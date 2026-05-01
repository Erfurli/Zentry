export interface Usuario {
  id: string;
  empleadoId: string;
  username: string;
  rolSistema: 'USER' | 'ADMIN';
  activo: boolean;
}
