import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar glass-card">
      <div class="brand">
        <i class="pi pi-wallet brand-icon glow-text-cyan"></i>
        <span class="brand-title">Fin<span class="glow-text-indigo">Track</span></span>
      </div>
      <nav class="nav-links">
        <a routerLink="/transactions" routerLinkActive="active" class="nav-item">
          <i class="pi pi-list"></i>
          <span>Transactions</span>
        </a>
        <a routerLink="/categories" routerLinkActive="active" class="nav-item">
          <i class="pi pi-tags"></i>
          <span>Categories</span>
        </a>
      </nav>
      <div class="user-footer">
        <div class="user-info">
          <span class="user-email">{{ authService.currentUser()?.email }}</span>
        </div>
        <button (click)="authService.logout()" class="logout-btn" title="Logout">
          <i class="pi pi-power-off"></i>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: calc(100vh - 2rem);
      margin: 1rem;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem;
      flex-shrink: 0;
      position: sticky;
      top: 1rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.4rem;
      font-weight: 700;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 1.5rem;
    }
    .brand-icon {
      font-size: 1.6rem;
    }
    .nav-links {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.75rem 1rem;
      color: #94a3b8;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 500;
      border: 1px solid transparent;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .nav-item i {
      font-size: 1.1rem;
      transition: color 0.2s ease, transform 0.2s ease;
    }
    .nav-item:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #f1f5f9;
      border-color: rgba(255, 255, 255, 0.1);
    }
    .nav-item:hover i {
      color: #38bdf8;
      transform: translateX(2px);
    }
    .nav-item.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.15));
      color: #ffffff;
      border-color: rgba(56, 189, 248, 0.4);
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(6, 182, 212, 0.15);
    }
    .nav-item.active i {
      color: #38bdf8;
    }
    .user-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 1rem;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .user-email {
      font-size: 0.85rem;
      color: #94a3b8;
      max-width: 170px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .logout-btn {
      background: transparent;
      border: none;
      color: #f43f5e;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0.4rem;
      border-radius: 6px;
      transition: background 0.2s ease;
    }
    .logout-btn:hover {
      background: rgba(244, 63, 94, 0.15);
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
}
