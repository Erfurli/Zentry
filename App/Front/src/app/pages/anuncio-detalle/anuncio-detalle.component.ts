import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AnuncioService } from '../../services/anuncio.service';
import { AuthService } from '../../services/auth.service';
import { Anuncio, ComentarioAnuncio } from '../../models/anuncio.model';

@Component({
  selector: 'app-anuncio-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './anuncio-detalle.component.html',
  styleUrl: './anuncio-detalle.component.css'
})
export class AnuncioDetalleComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private service = inject(AnuncioService);
  private auth    = inject(AuthService);

  readonly anuncio      = signal<Anuncio | null>(null);
  readonly cargando     = signal(true);
  readonly enviando     = signal(false);
  readonly subiendoImg  = signal(false);

  readonly esAdmin      = computed(() => this.auth.isAdmin());
  readonly usuarioId    = computed(() => this.auth.getUsuarioActual()?.id ?? '');

  textoComentario = '';
  respondiendo: ComentarioAnuncio | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/dashboard']); return; }

    this.service.getAnuncio(id).subscribe({
      next: a => { this.anuncio.set(a); this.cargando.set(false); },
      error: () => this.router.navigate(['/dashboard'])
    });

    this.service.marcarVisto(id).subscribe();
  }

  comentariosRaiz(): ComentarioAnuncio[] {
    return (this.anuncio()?.comentarios ?? [])
      .filter(c => !c.respuestaAId)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  respuestasA(id: string): ComentarioAnuncio[] {
    return (this.anuncio()?.comentarios ?? [])
      .filter(c => c.respuestaAId === id)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  responder(c: ComentarioAnuncio): void {
    this.respondiendo = c;
    setTimeout(() => document.getElementById('input-comentario')?.focus(), 50);
  }

  cancelarRespuesta(): void { this.respondiendo = null; }

  enviarComentario(): void {
    const texto = this.textoComentario.trim();
    const id    = this.anuncio()?.id;
    if (!texto || !id) return;

    this.enviando.set(true);
    this.service.comentar(id, texto, this.respondiendo?.id).subscribe({
      next: a => {
        this.anuncio.set(a);
        this.textoMensaje = '';
        this.textoComentario = '';
        this.respondiendo = null;
        this.enviando.set(false);
      },
      error: () => this.enviando.set(false)
    });
  }

  get textoMensaje(): string { return this.textoComentario; }
  set textoMensaje(v: string) { this.textoComentario = v; }

  eliminarComentario(comentarioId: string): void {
    const id = this.anuncio()?.id;
    if (!id) return;
    this.service.eliminarComentario(id, comentarioId).subscribe({
      next: a => this.anuncio.set(a)
    });
  }

  puedeEliminarComentario(c: ComentarioAnuncio): boolean {
    return this.esAdmin() || c.autorId === this.usuarioId();
  }

  onImagenSeleccionada(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.anuncio()?.id) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.subiendoImg.set(true);
      this.service.subirImagen(this.anuncio()!.id!, reader.result as string).subscribe({
        next: a => { this.anuncio.set(a); this.subiendoImg.set(false); },
        error: () => this.subiendoImg.set(false)
      });
    };
    reader.readAsDataURL(file);
  }

  irAPerfil(empleadoId: string): void {
    this.router.navigate(['/perfil'], { queryParams: { empleadoId } });
  }

  getIniciales(nombre: string): string {
    const p = nombre.trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.substring(0, 2).toUpperCase();
  }

  getCategoriaIcon(cat: string): string {
    const map: Record<string, string> = {
      IMPORTANTE: 'fa-solid fa-circle-exclamation',
      URGENTE:    'fa-solid fa-triangle-exclamation',
      EVENTO:     'fa-solid fa-calendar-star',
      GENERAL:    'fa-solid fa-circle-info'
    };
    return map[cat] ?? 'fa-solid fa-circle-info';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatearFechaCorta(fecha: string): string {
    const d = new Date(fecha);
    const hoy = new Date();
    const diff = Math.floor((hoy.getTime() - d.getTime()) / 60000);
    if (diff < 1)  return 'ahora mismo';
    if (diff < 60) return `hace ${diff} min`;
    if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  volver(): void { this.router.navigate(['/dashboard']); }
}
