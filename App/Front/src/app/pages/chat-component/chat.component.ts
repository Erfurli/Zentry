import {
  Component, OnInit, OnDestroy, inject, signal, computed, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ConversacionDTO, MensajeDTO, UsuarioResumen } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const ESTADOS = [
  { valor: 'activo',     label: 'Activo',          icon: 'fa-solid fa-circle-check',  color: '#10b981' },
  { valor: 'inactivo',   label: 'Inactivo',         icon: 'fa-solid fa-circle',        color: '#94a3b8' },
  { valor: 'vacaciones', label: 'De vacaciones',    icon: 'fa-solid fa-umbrella-beach', color: '#3b82f6' },
  { valor: 'reunion',    label: 'En una reunión',   icon: 'fa-solid fa-briefcase',     color: '#f59e0b' },
  { valor: 'nodisturb',  label: 'No molestar',      icon: 'fa-solid fa-ban',           color: '#ef4444' },
];

interface Toast {
  id: number;
  conv: string;
  autor: string;
  texto: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  @ViewChild('mensajesContainer') mensajesContainer!: ElementRef;

  readonly EMOJIS = EMOJIS;
  readonly ESTADOS = ESTADOS;

  readonly conversaciones        = signal<ConversacionDTO[]>([]);
  readonly conversacionActiva    = signal<ConversacionDTO | null>(null);
  readonly mensajes              = signal<MensajeDTO[]>([]);
  readonly textoMensaje          = signal('');
  readonly mensajeRespondiendo   = signal<MensajeDTO | null>(null);
  readonly modalPerfil           = signal<UsuarioResumen | null>(null);
  readonly modalNuevoGrupo       = signal(false);
  readonly modalMensajeDirecto   = signal(false);
  readonly nuevoGrupoNombre      = signal('');
  readonly filtroBusqueda        = signal('');
  readonly usuarioActualId       = signal('');
  readonly mensajeConMenuAbierto = signal<string | null>(null);
  readonly mensajeConReaccionAbierto = signal<string | null>(null);
  readonly nuevoGrupoParticipantes   = signal<string[]>([]);
  readonly empleadosDisponibles      = signal<UsuarioResumen[]>([]);
  readonly estadoActual          = signal('activo');
  readonly mostrarEstados        = signal(false);
  readonly toasts                = signal<Toast[]>([]);
  readonly noLeidasTotal         = signal(0);
  private toastId = 0;

  readonly conversacionesFiltradas = computed(() => {
    const q = this.filtroBusqueda().toLowerCase();
    return this.conversaciones().filter(c => !q || c.nombre?.toLowerCase().includes(q));
  });

  readonly conversacionesPorTipo = computed(() => {
  const convs = this.conversacionesFiltradas().slice().sort((a, b) => {
    const fa = a.ultimoMensaje?.enviadoEn ?? '';
    const fb = b.ultimoMensaje?.enviadoEn ?? '';
    return fb.localeCompare(fa);
  });
  return {
    jefes:        convs.filter(c => c.tipo === 'JEFES'),
    departamento: convs.filter(c => c.tipo === 'DEPARTAMENTO'),
    grupos:       convs.filter(c => c.tipo === 'GRUPO'),
    individuales: convs.filter(c => c.tipo === 'INDIVIDUAL'),
  };
});

getEstadoObj(valor: string) {
  return ESTADOS.find(e => e.valor === valor) ?? ESTADOS[0];
}

getHoraUltimoMensaje(conv: ConversacionDTO): string {
  if (!conv.ultimoMensaje?.enviadoEn) return '';
  const fecha = new Date(conv.ultimoMensaje.enviadoEn);
  const hoy = new Date();
  const esHoy = fecha.toDateString() === hoy.toDateString();

  if (esHoy) {
    return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } else {
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  }
}

  readonly estadoActualObj = computed(() =>
    ESTADOS.find(e => e.valor === this.estadoActual()) ?? ESTADOS[0]
  );

  ngOnInit(): void {
  const me = this.authService.getUsuarioActual();
  if (me) {
    this.usuarioActualId.set(me.id);

    this.chatService.conectarGlobal(me.id, (msg: MensajeDTO) => {
      const convActiva = this.conversacionActiva();

      if (!convActiva || convActiva.id !== msg.conversacionId) {
        this.conversaciones.update(list =>
          list.map(c => c.id === msg.conversacionId
            ? { ...c, noLeidos: (c.noLeidos ?? 0) + 1, ultimoMensaje: msg }
            : c
          )
        );
        this.recalcularNoLeidas();
      }
    });
  }

  this.chatService.getConversaciones().subscribe({
    next: convs => {
      this.conversaciones.set(convs);
      this.noLeidasTotal.set(convs.reduce((acc, c) => acc + (c.noLeidos ?? 0), 0));
    }
  });
}

  ngOnDestroy(): void {
    this.chatService.desconectar();
  }

  toggleEstados(): void {
  this.mostrarEstados.update(v => !v);
}

  seleccionarConversacion(conv: ConversacionDTO): void {
    this.chatService.desconectar();
    this.conversacionActiva.set(conv);
    this.mensajeRespondiendo.set(null);

    this.conversaciones.update(list =>
      list.map(c => c.id === conv.id ? { ...c, noLeidos: 0 } : c)
    );
    this.recalcularNoLeidas();

    this.chatService.getMensajes(conv.id).subscribe({
      next: msgs => { this.mensajes.set(msgs); setTimeout(() => this.scrollAbajo(), 50); }
    });

    this.chatService.conectar(conv.id, (msg) => {
  const esMio = msg.autorId === this.usuarioActualId();

  this.mensajes.update(list => {
    const idx = list.findIndex(m => m.id === msg.id);
    if (idx >= 0) { const c = [...list]; c[idx] = msg; return c; }
    return [...list, msg];
  });

  this.conversaciones.update(list =>
    list.map(c => c.id === conv.id ? { ...c, ultimoMensaje: msg } : c)
  );

  if (!esMio) {
    this.mostrarToast(
      this.getNombreConversacion(conv),
      msg.autorNombre,
      msg.contenido
    );
  }

  setTimeout(() => this.scrollAbajo(), 50);
});
  }



  enviar(): void {
    const texto = this.textoMensaje().trim();
    const conv  = this.conversacionActiva();
    if (!texto || !conv) return;
    this.chatService.enviarMensaje(conv.id, texto, this.mensajeRespondiendo()?.id);
    this.textoMensaje.set('');
    this.mensajeRespondiendo.set(null);
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.enviar(); }
  }

  responder(msg: MensajeDTO): void { this.mensajeRespondiendo.set(msg); this.cerrarMenus(); }

  toggleReaccion(mensajeId: string, emoji: string): void {
    this.chatService.toggleReaccion(mensajeId, emoji);
    this.mensajeConReaccionAbierto.set(null);
  }

  tieneReaccion(msg: MensajeDTO, emoji: string): boolean {
    return msg.reacciones?.[emoji]?.includes(this.usuarioActualId()) ?? false;
  }

  reaccionesResumidas(msg: MensajeDTO): { emoji: string; count: number }[] {
    return Object.entries(msg.reacciones ?? {})
      .filter(([, ids]) => ids.length > 0)
      .map(([emoji, ids]) => ({ emoji, count: ids.length }));
  }

  esMio(msg: MensajeDTO): boolean { return msg.autorId === this.usuarioActualId(); }

  verPerfil(p: UsuarioResumen): void { this.modalPerfil.set(p); }

  abrirIndividualDesdeGrupo(p: UsuarioResumen): void {
    this.modalPerfil.set(null);
    this.modalMensajeDirecto.set(false);
    this.chatService.abrirIndividual(p.id).subscribe({
      next: conv => {
        this.conversaciones.update(list => list.find(c => c.id === conv.id) ? list : [conv, ...list]);
        this.seleccionarConversacion(conv);
      }
    });
  }

  abrirModalNuevoGrupo(): void {
    this.chatService.getEmpleadosParaChat().subscribe({
      next: empleados => this.empleadosDisponibles.set(empleados)
    });
    this.modalNuevoGrupo.set(true);
  }

  abrirModalMensajeDirecto(): void {
    this.chatService.getEmpleadosParaChat().subscribe({
      next: empleados => this.empleadosDisponibles.set(empleados)
    });
    this.modalMensajeDirecto.set(true);
  }

  crearGrupo(): void {
    const nombre = this.nuevoGrupoNombre().trim();
    if (!nombre || this.nuevoGrupoParticipantes().length === 0) return;
    this.chatService.crearGrupo(nombre, this.nuevoGrupoParticipantes()).subscribe({
      next: conv => {
        this.conversaciones.update(list => [conv, ...list]);
        this.modalNuevoGrupo.set(false);
        this.nuevoGrupoNombre.set('');
        this.nuevoGrupoParticipantes.set([]);
        this.seleccionarConversacion(conv);
      }
    });
  }

  toggleParticipante(id: string): void {
    this.nuevoGrupoParticipantes.update(list =>
      list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    );
  }

  setEstado(valor: string): void {
    this.estadoActual.set(valor);
    this.mostrarEstados.set(false);
  }

  cerrarMenus(): void {
    this.mensajeConMenuAbierto.set(null);
    this.mensajeConReaccionAbierto.set(null);
  }

  toggleReaccionPicker(id: string): void {
    this.mensajeConReaccionAbierto.set(
      this.mensajeConReaccionAbierto() === id ? null : id
    );
    this.mensajeConMenuAbierto.set(null);
  }

  private mostrarToast(conv: string, autor: string, texto: string): void {
    const id = ++this.toastId;
    this.toasts.update(t => [...t, { id, conv, autor, texto }]);
    setTimeout(() => this.cerrarToast(id), 4000);
  }

  cerrarToast(id: number): void {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }

  private recalcularNoLeidas(): void {
    this.noLeidasTotal.set(
      this.conversaciones().reduce((acc, c) => acc + (c.noLeidos ?? 0), 0)
    );
  }

  private scrollAbajo(): void {
    const el = this.mensajesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  formatHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  getNombreConversacion(conv: ConversacionDTO): string {
    if (conv.nombre) return conv.nombre;
    const otro = conv.participantes.find(p => p.id !== this.usuarioActualId());
    return otro?.nombre ?? 'Conversación';
  }

  getInicialesConversacion(conv: ConversacionDTO): string {
    const nombre = this.getNombreConversacion(conv);
    const partes = nombre.split(' ');
    return partes.length >= 2 ? partes[0][0] + partes[1][0] : nombre.substring(0, 2);
  }
}
