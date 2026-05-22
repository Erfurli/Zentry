import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnuncioService } from '../../services/anuncio.service';
import { Anuncio } from '../../models/anuncio.model';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tablon-anuncios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './anuncios.component.html',
  styleUrls: ['./anuncios.component.css']
})
export class TablonAnunciosComponent implements OnInit {
  private anuncioService = inject(AnuncioService);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly anuncios = signal<Anuncio[]>([]);
  readonly cargando = signal(true);
  readonly anuncioSeleccionado = signal<Anuncio | null>(null);
  readonly mostrarFormulario = signal(false);
  readonly modoEdicion = signal(false);
  readonly guardando = signal(false);

  private readonly STORAGE_KEY = 'zentry_anuncios_vistos';
  private vistosLocal: Set<string> = new Set();

  form: Partial<Anuncio> = this.formVacio();

  readonly esAdmin = computed(() => this.authService.isAdmin());

  readonly noLeidos = computed(() =>
    this.anuncios().filter(a => !this.estaVisto(a)).length
  );

  readonly esUrgente = computed(() =>
    (this.form.categoria ?? '').toString().toLowerCase() === 'urgente'
  );

  ngOnInit(): void {
    this.cargarVistosLocal();
    this.cargarAnuncios();
  }

  cargarAnuncios(): void {
    this.cargando.set(true);
    this.anuncioService.getAnuncios().subscribe({
      next: data => {
        this.anuncios.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  verAnuncio(anuncio: Anuncio): void {
    if (anuncio.id) {
      this.router.navigate(['/anuncios', anuncio.id]);
    }
  }

  cerrarModal(): void {
    this.anuncioSeleccionado.set(null);
  }

  abrirFormulario(): void {
    this.form = this.formVacio();
    this.modoEdicion.set(false);
    this.mostrarFormulario.set(true);
  }

  editarAnuncio(anuncio: Anuncio): void {
    this.form = {
      ...anuncio,
      fechaExpiracion: anuncio.fechaExpiracion
        ? new Date(anuncio.fechaExpiracion).toISOString().slice(0, 16)
        : undefined
    };
    this.modoEdicion.set(true);
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
  }

  onCategoriaChange(): void {
    if ((this.form.categoria ?? '').toString().toLowerCase() === 'urgente') {
      this.form.fechaExpiracion = undefined;
    }
  }

  guardarAnuncio(): void {
    if (!this.form.titulo?.trim() || !this.form.contenido?.trim()) return;

    const categoria = (this.form.categoria as Anuncio['categoria']) ?? 'GENERAL';
    const urgente = categoria.toLowerCase() === 'urgente';

    this.guardando.set(true);

    const payload: Anuncio = {
      titulo: this.form.titulo!,
      contenido: this.form.contenido!,
      categoria,
      destacado: this.form.destacado ?? false,
      fechaExpiracion: urgente
        ? null
        : (this.form.fechaExpiracion
            ? new Date(this.form.fechaExpiracion as string).toISOString()
            : null)
    };

    const op = this.modoEdicion() && this.form.id
      ? this.anuncioService.editar(this.form.id, payload)
      : this.anuncioService.crear(payload);

    op.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarFormulario();
        this.cargarAnuncios();
      },
      error: () => {
        this.guardando.set(false);
      }
    });
  }

  eliminarAnuncio(anuncio: Anuncio): void {
    if (!anuncio.id) return;
    if (!confirm(`¿Eliminar el anuncio "${anuncio.titulo}"?`)) return;
    this.anuncioService.eliminar(anuncio.id).subscribe(() => this.cargarAnuncios());
  }

  getCategoriaIcon(cat: string): string {
    const map: Record<string, string> = {
      IMPORTANTE: 'fa-solid fa-circle-exclamation',
      URGENTE: 'fa-solid fa-triangle-exclamation',
      EVENTO: 'fa-solid fa-calendar-star',
      GENERAL: 'fa-solid fa-circle-info'
    };
    return map[cat] ?? 'fa-solid fa-circle-info';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  estaVisto(anuncio: Anuncio): boolean {
    return !!anuncio.id && this.vistosLocal.has(anuncio.id);
  }

  private cargarVistosLocal(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      this.vistosLocal = new Set(raw ? JSON.parse(raw) : []);
    } catch {
      this.vistosLocal = new Set();
    }
  }

  private marcarVistoLocal(id: string): void {
    this.vistosLocal.add(id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...this.vistosLocal]));
  }

  private formVacio(): Partial<Anuncio> {
    return {
      titulo: '',
      contenido: '',
      categoria: 'GENERAL',
      destacado: false,
      fechaExpiracion: undefined
    };
  }

  mostrarExpiracion(anuncio: Anuncio): boolean {
    return !!anuncio.fechaExpiracion && anuncio.categoria.toLowerCase() !== 'urgente';
  }
}
