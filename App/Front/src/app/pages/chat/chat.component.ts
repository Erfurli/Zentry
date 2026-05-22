import {
  Component, OnInit, OnDestroy, inject, signal, computed,
  ElementRef, ViewChild, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ConversacionDTO, MensajeDTO, UsuarioResumen } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const ESTADOS = [
  { valor: 'activo',     label: 'Activo',          icon: 'fa-solid fa-circle-check',   color: '#10b981' },
  { valor: 'inactivo',   label: 'Inactivo',         icon: 'fa-solid fa-circle',         color: '#94a3b8' },
  { valor: 'vacaciones', label: 'De vacaciones',    icon: 'fa-solid fa-umbrella-beach', color: '#3b82f6' },
  { valor: 'reunion',    label: 'En una reunión',   icon: 'fa-solid fa-briefcase',      color: '#f59e0b' },
  { valor: 'nodisturb',  label: 'No molestar',      icon: 'fa-solid fa-ban',            color: '#ef4444' },
];

interface Toast { id: number; conv: string; autor: string; texto: string; }
interface MencionSugerida { id: string; nombre: string; iniciales: string; foto?: string; }

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
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLTextAreaElement>;

  readonly EMOJIS  = EMOJIS;
  readonly ESTADOS = ESTADOS;

  readonly conversaciones            = this.chatService.conversaciones;
  readonly conversacionActiva        = signal<ConversacionDTO | null>(null);
  readonly mensajes                  = signal<MensajeDTO[]>([]);
  readonly mensajesFijados           = signal<MensajeDTO[]>([]);
  readonly mostrarFijados            = signal(false);
  readonly textoMensaje              = signal('');
  readonly mensajeRespondiendo       = signal<MensajeDTO | null>(null);
  readonly mensajeEditando           = signal<MensajeDTO | null>(null);
  readonly modalPerfil               = signal<UsuarioResumen | null>(null);
  readonly modalNuevoGrupo           = signal(false);
  readonly modalMensajeDirecto       = signal(false);
  readonly nuevoGrupoNombre          = signal('');
  readonly filtroBusqueda            = signal('');
  readonly usuarioActualId           = signal('');
  readonly mensajeConReaccionAbierto = signal<string | null>(null);
  readonly nuevoGrupoParticipantes   = signal<string[]>([]);
  readonly empleadosDisponibles      = signal<UsuarioResumen[]>([]);
  readonly estadoActual              = signal('activo');
  readonly mostrarEstados            = signal(false);
  readonly toasts                    = signal<Toast[]>([]);
  readonly noLeidasTotal             = signal(0);

  readonly mencionSugerencias = signal<MencionSugerida[]>([]);
  readonly mencionQuery       = signal('');
  readonly mencionIndice      = signal(0);

  private toastId = 0;
  private globalSub: any;

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

  readonly estadoActualObj = computed(() =>
    ESTADOS.find(e => e.valor === this.estadoActual()) ?? ESTADOS[0]
  );

  ngOnInit(): void {
    this.chatService.resetNoLeidasGlobal();
    const me = this.authService.getUsuarioActual();
    if (me) this.usuarioActualId.set(me.id);

    this.chatService.getConversaciones().subscribe({
      next: convs => {
        const actuales = this.conversaciones();
        const merged = convs.map(c => {
          const existente = actuales.find(a => a.id === c.id);
          return { ...c, noLeidos: existente ? existente.noLeidos : c.noLeidos };
        });
        this.conversaciones.set(merged);
        this.noLeidasTotal.set(merged.reduce((acc, c) => acc + (c.noLeidos ?? 0), 0));
      }
    });

    this.globalSub = this.chatService.mensajeGlobalRecibido$.subscribe(msg => {
      const convActiva = this.conversacionActiva();
      this.conversaciones.update(list =>
        list.map(c => c.id === msg.conversacionId ? {
          ...c,
          ultimoMensaje: msg,
          noLeidos: (!convActiva || convActiva.id !== msg.conversacionId)
            ? (c.noLeidos ?? 0) + 1
            : c.noLeidos
        } : c)
      );
    });
  }

  ngOnDestroy(): void {
    this.chatService.desconectar();
    this.globalSub?.unsubscribe();
  }

  seleccionarConversacion(conv: ConversacionDTO): void {
    this.chatService.desconectar();
    this.conversacionActiva.set(conv);
    this.mensajeRespondiendo.set(null);
    this.mensajeEditando.set(null);
    this.textoMensaje.set('');
    this.mensajesFijados.set([]);
    this.mostrarFijados.set(false);

    this.chatService.conversaciones.update(list =>
      list.map(c => c.id === conv.id ? { ...c, noLeidos: 0 } : c)
    );
    this.chatService.noLeidasGlobal.update(n => Math.max(0, n - (conv.noLeidos ?? 0)));

    this.chatService.getMensajes(conv.id).subscribe({
      next: msgs => { this.mensajes.set(msgs); setTimeout(() => this.scrollAbajo(), 50); }
    });

    this.chatService.getMensajesFijados(conv.id).subscribe({
      next: fijados => this.mensajesFijados.set(fijados)
    });

    this.chatService.conectar(conv.id, (msg) => {
      const esMio = msg.autorId === this.usuarioActualId();

      this.mensajes.update(list => {
        const idx = list.findIndex(m => m.id === msg.id);
        if (idx >= 0) { const c = [...list]; c[idx] = msg; return c; }
        return [...list, msg];
      });

      if (msg.fijado || this.mensajesFijados().some(f => f.id === msg.id)) {
        this.mensajesFijados.update(list => {
          const idx = list.findIndex(f => f.id === msg.id);
          if (msg.fijado && idx < 0) return [...list, msg];
          if (!msg.fijado && idx >= 0) return list.filter(f => f.id !== msg.id);
          if (idx >= 0) { const c = [...list]; c[idx] = msg; return c; }
          return list;
        });
      }

      this.conversaciones.update(list =>
        list.map(c => c.id === conv.id ? { ...c, ultimoMensaje: msg } : c)
      );

      if (!esMio) {
        this.mostrarToast(this.getNombreConversacion(conv), msg.autorNombre, msg.contenido);
      }

      setTimeout(() => this.scrollAbajo(), 50);
    });
  }

  enviar(): void {
    const texto = this.textoMensaje().trim();
    const conv  = this.conversacionActiva();
    if (!texto || !conv) return;

    if (this.mensajeEditando()) {
      this.chatService.editarMensaje(this.mensajeEditando()!.id, texto);
      this.cancelarEdicion();
      return;
    }

    const menciones = this.extraerMenciones(texto);
    this.chatService.enviarMensaje(conv.id, texto, this.mensajeRespondiendo()?.id, menciones);
    this.textoMensaje.set('');
    this.mensajeRespondiendo.set(null);
    this.mencionSugerencias.set([]);
  }

  onKeyDown(e: KeyboardEvent): void {
    if (this.mencionSugerencias().length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.mencionIndice.update(i => Math.min(i + 1, this.mencionSugerencias().length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.mencionIndice.update(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        this.seleccionarMencion(this.mencionSugerencias()[this.mencionIndice()]);
        return;
      }
      if (e.key === 'Escape') {
        this.mencionSugerencias.set([]);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.enviar(); }
  }

  onInput(event: Event): void {
    const texto = (event.target as HTMLTextAreaElement).value;
    this.textoMensaje.set(texto);
    this.detectarMencion(texto);
  }

  toggleFijados(): void { this.mostrarFijados.update(v => !v); }

  private detectarMencion(texto: string): void {
    const match = texto.match(/@(\w*)$/);
    if (!match) {
      this.mencionSugerencias.set([]);
      return;
    }
    const query = match[1].toLowerCase();
    this.mencionQuery.set(query);
    this.mencionIndice.set(0);

    const conv = this.conversacionActiva();
    if (!conv) return;

    const sugerencias = conv.participantes
      .filter(p => p.id !== this.usuarioActualId())
      .filter(p => p.nombre.toLowerCase().includes(query))
      .map(p => ({
        id: p.id,
        nombre: p.nombre,
        iniciales: p.iniciales,
        foto: p.foto
      }));

    this.mencionSugerencias.set(sugerencias);
  }

  seleccionarMencion(m: MencionSugerida): void {
    const texto = this.textoMensaje();
    const nuevo = texto.replace(/@\w*$/, `@${m.nombre} `);
    this.textoMensaje.set(nuevo);
    this.mencionSugerencias.set([]);
    setTimeout(() => {
      const el = this.inputRef?.nativeElement;
      if (el) { el.value = nuevo; el.focus(); el.setSelectionRange(nuevo.length, nuevo.length); }
    }, 0);
  }

  private extraerMenciones(texto: string): string[] {
    const conv = this.conversacionActiva();
    if (!conv) return [];
    const matches = texto.match(/@[\wÀ-ÿ]+/g) ?? [];
    return matches.flatMap(m => {
      const nombre = m.slice(1).toLowerCase();
      return conv.participantes
        .filter(p => p.nombre.toLowerCase().startsWith(nombre))
        .map(p => p.id);
    });
  }

  iniciarEdicion(msg: MensajeDTO): void {
    this.mensajeEditando.set(msg);
    this.textoMensaje.set(msg.contenido);
    this.mensajeRespondiendo.set(null);
    setTimeout(() => this.inputRef?.nativeElement?.focus(), 50);
  }

  cancelarEdicion(): void {
    this.mensajeEditando.set(null);
    this.textoMensaje.set('');
  }

  fijar(msg: MensajeDTO): void {
    this.chatService.fijarMensaje(msg.id);
  }

  responder(msg: MensajeDTO): void {
    this.mensajeRespondiendo.set(msg);
    this.mensajeEditando.set(null);
    this.cerrarMenus();
    setTimeout(() => this.inputRef?.nativeElement?.focus(), 50);
  }

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
    this.chatService.getEmpleadosParaChat().subscribe({ next: e => this.empleadosDisponibles.set(e) });
    this.modalNuevoGrupo.set(true);
  }

  abrirModalMensajeDirecto(): void {
    this.chatService.getEmpleadosParaChat().subscribe({ next: e => this.empleadosDisponibles.set(e) });
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

  setEstado(valor: string): void { this.estadoActual.set(valor); this.mostrarEstados.set(false); }
  toggleEstados(): void { this.mostrarEstados.update(v => !v); }

  cerrarMenus(): void { this.mensajeConReaccionAbierto.set(null); }

  toggleReaccionPicker(id: string): void {
    this.mensajeConReaccionAbierto.set(this.mensajeConReaccionAbierto() === id ? null : id);
  }

  getEstadoObj(valor: string) { return ESTADOS.find(e => e.valor === valor) ?? ESTADOS[0]; }

  getHoraUltimoMensaje(conv: ConversacionDTO): string {
    if (!conv.ultimoMensaje?.enviadoEn) return '';
    const fecha = new Date(conv.ultimoMensaje.enviadoEn);
    const esHoy = fecha.toDateString() === new Date().toDateString();
    return esHoy
      ? fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      : fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  }

  private mostrarToast(conv: string, autor: string, texto: string): void {
    const id = ++this.toastId;
    this.toasts.update(t => [...t, { id, conv, autor, texto }]);
    setTimeout(() => this.cerrarToast(id), 4000);
  }

  cerrarToast(id: number): void { this.toasts.update(t => t.filter(x => x.id !== id)); }

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

  getFotoAutor(autorId: string): string | null {
    return this.conversacionActiva()?.participantes.find(p => p.id === autorId)?.foto ?? null;
  }

  getFotoConversacion(conv: ConversacionDTO): string | null {
    if (conv.tipo !== 'INDIVIDUAL') return null;
    return conv.participantes.find(p => p.id !== this.usuarioActualId())?.foto ?? null;
  }

  getOtroParticipante(conv: ConversacionDTO): UsuarioResumen | null {
    return conv.participantes.find(p => p.id !== this.usuarioActualId()) ?? null;
  }

  renderContenidoConMenciones(contenido: string): string {
    const conv = this.conversacionActiva();
    if (!conv) return contenido;
    let resultado = contenido;
    conv.participantes.forEach(p => {
      const regex = new RegExp(`@${p.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      resultado = resultado.replace(regex, `<span class="mencion">@${p.nombre}</span>`);
    });
    return resultado;
  }

  esMencionado(msg: MensajeDTO): boolean {
    return msg.menciones?.includes(this.usuarioActualId()) ?? false;
  }
}
