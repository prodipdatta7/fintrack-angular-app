import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'dark' | 'light';
export type AccentColor = 'teal' | 'indigo' | 'cyan' | 'emerald' | 'rose' | 'amber';

@Injectable({
    providedIn: 'root',
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
            // Re-apply accent so light/dark brand defaults stay in sync.
            this.applyAccent(this.accentColor(), t);
        });

        effect(() => {
            const c = this.accentColor();
            this.applyAccent(c, this.theme());
            localStorage.setItem(this.ACCENT_KEY, c);
        });
    }

    toggle(): void {
        this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
    }

    setAccent(color: AccentColor): void {
        this.accentColor.set(color);
    }

    /** Accent actually painted — light remaps Cosmic Teal → indigo brand. */
    effectiveAccent(): AccentColor {
        const color = this.accentColor();
        return this.theme() === 'light' && color === 'teal' ? 'indigo' : color;
    }

    private applyTheme(theme: Theme): void {
        if (!isPlatformBrowser(this.platformId)) return;
        const html = document.documentElement;
        html.classList.remove('app-dark', 'app-light');
        html.classList.add(`app-${theme}`);
    }

    private applyAccent(color: AccentColor, theme: Theme = this.theme()): void {
        if (!isPlatformBrowser(this.platformId)) return;
        const root = document.documentElement;

        // Light mode brand is indigo; Cosmic Teal is the dark default.
        // Remap stored "teal" on light so dark preference doesn't wash out light.
        const effective: AccentColor = theme === 'light' && color === 'teal' ? 'indigo' : color;

        const accents: Record<
            AccentColor,
            {
                primary: string;
                primarySoft: string;
                primaryDeep: string;
                primaryGlow: string;
                gradient: string;
            }
        > = {
            teal: {
                primary: '#1b6b8a',
                primarySoft: '#2484aa',
                primaryDeep: '#155a74',
                primaryGlow: 'rgba(27, 107, 138, 0.4)',
                gradient: 'linear-gradient(135deg, #1b6b8a 0%, #2484aa 100%)',
            },
            indigo: {
                primary: '#6366f1',
                primarySoft: '#818cf8',
                primaryDeep: '#4f46e5',
                primaryGlow:
                    theme === 'light' ? 'rgba(99, 102, 241, 0.28)' : 'rgba(99, 102, 241, 0.4)',
                gradient: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
            },
            cyan: {
                // Violet — clearer on white than cyan
                primary: '#7c3aed',
                primarySoft: '#8b5cf6',
                primaryDeep: '#6d28d9',
                primaryGlow:
                    theme === 'light' ? 'rgba(124, 58, 237, 0.28)' : 'rgba(124, 58, 237, 0.4)',
                gradient: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
            },
            emerald: {
                primary: '#10b981',
                primarySoft: '#34d399',
                primaryDeep: '#059669',
                primaryGlow: 'rgba(16, 185, 129, 0.4)',
                gradient: 'linear-gradient(135deg, #10b981 0%, #7c3aed 100%)',
            },
            rose: {
                primary: '#ef4444',
                primarySoft: '#f87171',
                primaryDeep: '#dc2626',
                primaryGlow: 'rgba(239, 68, 68, 0.4)',
                gradient: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
            },
            amber: {
                primary: '#f59e0b',
                primarySoft: '#fbbf24',
                primaryDeep: '#d97706',
                primaryGlow: 'rgba(245, 158, 11, 0.4)',
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            },
        };
        const a = accents[effective];
        root.style.setProperty('--primary', a.primary);
        root.style.setProperty('--primary-soft', a.primarySoft);
        root.style.setProperty('--primary-deep', a.primaryDeep);
        root.style.setProperty('--primary-glow', a.primaryGlow);
        root.style.setProperty('--gradient-primary', a.gradient);
    }

    private loadTheme(): Theme {
        if (!isPlatformBrowser(this.platformId)) return 'dark';
        const stored = localStorage.getItem(this.THEME_KEY);
        return stored === 'light' || stored === 'dark' ? stored : 'dark';
    }

    private loadAccent(): AccentColor {
        if (!isPlatformBrowser(this.platformId)) return 'teal';
        const stored = localStorage.getItem(this.ACCENT_KEY);
        const valid: AccentColor[] = ['teal', 'indigo', 'cyan', 'emerald', 'rose', 'amber'];
        return valid.includes(stored as AccentColor) ? (stored as AccentColor) : 'teal';
    }
}
