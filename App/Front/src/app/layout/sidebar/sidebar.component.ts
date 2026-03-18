import { Component, ChangeDetectionStrategy, signal, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.collapsed]': 'collapsed()' }
})
export class SidebarComponent {
  readonly collapsed = signal(false);
  readonly collapsedChange = output<boolean>();

  toggle(): void {
    this.collapsed.update(v => !v);
    this.collapsedChange.emit(this.collapsed());
  }
}
