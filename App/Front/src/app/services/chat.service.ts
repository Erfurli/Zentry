import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../enviroments/enviroment';
import { Subject } from 'rxjs';


export interface UsuarioResumen {
  id: string;
  nombre: string;
  iniciales: string;
  rolEmpresa: string;
  estado?: string;
  foto?: string;
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
  editadoEn?: string;
  fijado?: boolean;
  menciones?: string[];
}

export interface ConversacionDTO {
  id: string;
  nombre: string;
  tipo: 'INDIVIDUAL' | 'DEPARTAMENTO' | 'JEFES' | 'GRUPO';
  participantes: UsuarioResumen[];
  ultimoMensaje?: MensajeDTO;
  noLeidos: number | undefined;
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
  readonly mensajeGlobalRecibido$ = new Subject<MensajeDTO>();

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
  menciones?: string[]
): void {
  this.stompClient?.publish({
    destination: '/app/chat.enviar',
    body: JSON.stringify({ conversacionId, contenido, respuestaAId, menciones })
  });
}

  incrementarNoLeidos(conversacionId: string): void {
  this.conversaciones.update(list =>
    list.map(c => c.id === conversacionId
      ? { ...c, noLeidos: (c.noLeidos ?? 0) + 1 }
      : c
    )
  );
  this.noLeidasGlobal.update(n => n + 1);
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

  conectarGlobal(username: string, onNuevoMensaje: (m: MensajeDTO) => void): void {
  if (this.globalStompClient?.active) return;

  this.getConversaciones().subscribe({
    next: convs => {
      const total = convs.reduce((acc, c) => acc + (c.noLeidos ?? 0), 0);
      this.noLeidasGlobal.set(total);
    }
  });

  const token = localStorage.getItem('token');
  this.globalStompClient = new Client({
    webSocketFactory: () => new SockJS(`${this.API.replace('/api', '')}/ws`),
    connectHeaders: { Authorization: `Bearer ${token}` },
    onConnect: () => {
  this.globalStompClient!.subscribe(
    `/user/queue/chat-notif`,
    (msg: IMessage) => {
      const mensaje: MensajeDTO = JSON.parse(msg.body);
      this.mensajeGlobalRecibido$.next(mensaje);
      onNuevoMensaje(mensaje);
    }
  );
}
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

  editarMensaje(mensajeId: string, contenido: string): void {
  this.stompClient?.publish({
    destination: '/app/chat.editar',
    body: JSON.stringify({ mensajeId, contenido })
  });
}

fijarMensaje(mensajeId: string): void {
  this.stompClient?.publish({
    destination: '/app/chat.fijar',
    body: JSON.stringify({ mensajeId })
  });
}

getMensajesFijados(conversacionId: string) {
  return this.http.get<MensajeDTO[]>(`${this.API}/chat/conversaciones/${conversacionId}/fijados`);
}
}
