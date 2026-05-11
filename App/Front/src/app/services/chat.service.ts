import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../enviroments/enviroment';

export interface UsuarioResumen {
  id: string;
  nombre: string;
  iniciales: string;
  rolEmpresa: string;
  estado?: string;
}

export interface MensajeDTO {
  id: string;
  conversacionId: string;
  autorId: string;
  autorNombre: string;
  contenido: string;
  respuestaAId?: string;
  respuestaAContenido?: string;
  respuestaAAutor?: string;
  reacciones: Record<string, string[]>;
  enviadoEn: string;
}

export interface ConversacionDTO {
  id: string;
  nombre: string;
  tipo: 'INDIVIDUAL' | 'DEPARTAMENTO' | 'JEFES' | 'GRUPO';
  participantes: UsuarioResumen[];
  ultimoMensaje?: MensajeDTO;
  noLeidos: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private stompClient: Client | null = null;
  private globalStompClient: Client | null = null;
  private API = environment.apiUrl;

  readonly mensajesActivos = signal<MensajeDTO[]>([]);
  readonly conversaciones = signal<ConversacionDTO[]>([]);

  readonly noLeidasGlobal = signal<number>(0);

  getConversaciones() {
    return this.http.get<ConversacionDTO[]>(`${this.API}/chat/conversaciones`);
  }

  getMensajes(conversacionId: string) {
    return this.http.get<MensajeDTO[]>(
      `${this.API}/chat/conversaciones/${conversacionId}/mensajes`,
    );
  }

  crearGrupo(nombre: string, participanteIds: string[]) {
    return this.http.post<ConversacionDTO>(`${this.API}/chat/grupos`, {
      nombre,
      participanteIds,
    });
  }

  abrirIndividual(usuarioBId: string) {
    return this.http.post<ConversacionDTO>(
      `${this.API}/chat/individual/${usuarioBId}`,
      {},
    );
  }

  getEmpleadosParaChat() {
    return this.http.get<UsuarioResumen[]>(`${this.API}/chat/usuarios`);
  }

  conectar(conversacionId: string, onMensaje: (m: MensajeDTO) => void): void {
    const token = localStorage.getItem('token');
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${this.API.replace('/api', '')}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        this.stompClient!.subscribe(
          `/topic/conversacion/${conversacionId}`,
          (msg: IMessage) => onMensaje(JSON.parse(msg.body)),
        );
      },
    });
    this.stompClient.activate();
  }

  enviarMensaje(
    conversacionId: string,
    contenido: string,
    respuestaAId?: string,
  ): void {
    this.stompClient?.publish({
      destination: '/app/chat.enviar',
      body: JSON.stringify({ conversacionId, contenido, respuestaAId }),
    });
    
  }

  toggleReaccion(mensajeId: string, emoji: string): void {
    this.stompClient?.publish({
      destination: '/app/chat.reaccion',
      body: JSON.stringify({ mensajeId, emoji }),
    });
  }

  desconectar(): void {
    this.stompClient?.deactivate();
    this.stompClient = null;
  }

  conectarGlobal(
    usuarioId: string,
    onNuevoMensaje: (m: MensajeDTO) => void,
  ): void {
    if (this.globalStompClient?.active) return;

    const token = localStorage.getItem('token');
    this.globalStompClient = new Client({
      webSocketFactory: () => new SockJS(`${this.API.replace('/api', '')}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        this.globalStompClient!.subscribe(
          `/user/${usuarioId}/queue/chat-notif`,
          (msg: IMessage) => {
            const mensaje: MensajeDTO = JSON.parse(msg.body);
            this.noLeidasGlobal.update((n) => n + 1);
            onNuevoMensaje(mensaje);
          },
        );
      },
    });
    this.globalStompClient.activate();
  }

  desconectarGlobal(): void {
    this.globalStompClient?.deactivate();
    this.globalStompClient = null;
  }

  resetNoLeidasGlobal(): void {
    this.noLeidasGlobal.set(0);
  }
}
