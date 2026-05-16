import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ChatService, MensajeDTO } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { BadgesService } from '../../services/badges.service';

interface ToastGlobal {
  id: number;
  conv: string;
  autor: string;
  texto: string;
  conversacionId: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, CommonModule],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css'
})
export class AppLayoutComponent implements OnInit, OnDestroy {
  private badgesService = inject(BadgesService);
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private router      = inject(Router);

  sidebarCollapsed = signal(false);
  readonly toasts  = signal<ToastGlobal[]>([]);
  private toastId  = 0;

  readonly chatNoLeidas = this.chatService.noLeidasGlobal;

  ngOnInit(): void {
    this.badgesService.cargar();
  const me = this.authService.getUsuarioActual();
  const username = this.authService.getUsername();
  if (username) {
    this.chatService.conectarGlobal(username, (msg: MensajeDTO) => {
      this.mostrarToast(msg);
      this.chatService.incrementarNoLeidos(msg.conversacionId);
    });
  }
}

  ngOnDestroy(): void {
    this.chatService.desconectarGlobal();
  }

  private mostrarToast(msg: MensajeDTO): void {
    const id = ++this.toastId;
    this.toasts.update(t => [...t, {
      id,
      conv: msg.conversacionId,
      autor: msg.autorNombre,
      texto: msg.contenido,
      conversacionId: msg.conversacionId
    }]);
    setTimeout(() => this.cerrarToast(id), 5000);
  }

  cerrarToast(id: number): void {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }

  irAlChat(conversacionId: string, toastId: number): void {
    this.cerrarToast(toastId);
    this.router.navigate(['/chat'], { queryParams: { conv: conversacionId } });
  }

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
  }
}
