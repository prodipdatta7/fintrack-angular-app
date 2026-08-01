import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  get initials(): string {
    const email = this.authService.currentUser()?.email || '';
    const part = email.split('@')[0] || '?';
    const first = part[0]?.toUpperCase() || '?';
    const second = part.slice(1).includes('.') ? part.split('.').pop()?.[0]?.toUpperCase() || '' : '';
    return second ? first + second : first;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
