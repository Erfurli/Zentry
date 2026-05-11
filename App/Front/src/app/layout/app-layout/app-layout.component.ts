import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ChatService, MensajeDTO } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css'
})
export class AppLayoutComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  sidebarCollapsed = signal(false);

  readonly chatNoLeidas = this.chatService.noLeidasGlobal;

  ngOnInit(): void {
    const me = this.authService.getUsuarioActual();
    if (me?.id) {
      this.chatService.conectarGlobal(me.id, (_msg: MensajeDTO) => {
      });
    }
  }

  ngOnDestroy(): void {
    this.chatService.desconectarGlobal();
  }

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
  }
}
