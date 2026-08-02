import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'dark' | 'light';
export type AccentColor = 'indigo' | 'cyan' | 'emerald' | 'rose' | 'amber';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private readonly THEME_KEY = 'fintrack_theme';
  private readonly ACCENT_KEY = 'fintrack_accent';

  theme = signal<Theme>(this.loadTheme());
  accentColor = signal<AccentColor>(this.loadAccent());

  constructor() {
    effect(() => {
      const t = this.theme();
      this.applyTheme(t);
      localStorage.setItem(this.THEME_KEY, t);
    });

    effect(() => {
      const c = this.accentColor();
      this.applyAccent(c);
      localStorage.setItem(this.ACCENT_KEY, c);
    });
  }

  toggle(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setAccent(color: AccentColor): void {
    this.accentColor.set(color);
  }

  private applyTheme(theme: Theme): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const html = document.documentElement;
    html.classList.remove('app-dark', 'app-light');
    html.classList.add(`app-${theme}`);
  }

  private applyAccent(color: AccentColor): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const root = document.documentElement;
    const accents: Record<AccentColor, { primary: string; primarySoft: string; primaryDeep: string; primaryGlow: string; gradient: string }> = {
      indigo: {
        primary: '#6366f1', primarySoft: '#818cf8', primaryDeep: '#4f46e5',
        primaryGlow: 'rgba(99, 102, 241, 0.4)',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)'
      },
      cyan: {
        primary: '#06b6d4', primarySoft: '#22d3ee', primaryDeep: '#0891b2',
        primaryGlow: 'rgba(6, 182, 212, 0.4)',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #818cf8 100%)'
      },
      emerald: {
        primary: '#10b981', primarySoft: '#34d399', primaryDeep: '#059669',
        primaryGlow: 'rgba(16, 185, 129, 0.4)',
        gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
      },
      rose: {
        primary: '#f43f5e', primarySoft: '#fb7185', primaryDeep: '#e11d48',
        primaryGlow: 'rgba(244, 63, 94, 0.4)',
        gradient: 'linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%)'
      },
      amber: {
        primary: '#f59e0b', primarySoft: '#fbbf24', primaryDeep: '#d97706',
        primaryGlow: 'rgba(245, 158, 11, 0.4)',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #f43f5e 100%)'
      }
    };
    const a = accents[color];
    root.style.setProperty('--primary', a.primary);
    root.style.setProperty('--primary-soft', a.primarySoft);
    root.style.setProperty('--primary-deep', a.primaryDeep);
    root.style.setProperty('--primary-glow', a.primaryGlow);
    root.style.setProperty('--gradient-primary', a.gradient);
  }

  private loadTheme(): Theme {
    if (!isPlatformBrowser(this.platformId)) return 'dark';
    const stored = localStorage.getItem(this.THEME_KEY);
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  }

  private loadAccent(): AccentColor {
    if (!isPlatformBrowser(this.platformId)) return 'indigo';
    const stored = localStorage.getItem(this.ACCENT_KEY);
    const valid: AccentColor[] = ['indigo', 'cyan', 'emerald', 'rose', 'amber'];
    return valid.includes(stored as AccentColor) ? (stored as AccentColor) : 'indigo';
  }
}
