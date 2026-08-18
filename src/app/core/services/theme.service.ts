import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'dark' | 'light';

export type PresetAccent =
    | 'indigo'
    | 'cyan'
    | 'emerald'
    | 'rose'
    | 'amber'
    | 'teal'
    | 'purple'
    | 'fuchsia'
    | 'sky'
    | 'lime'
    | 'coral';

export type AccentColor = PresetAccent | 'custom';

export interface AccentTokens {
    primary: string;
    primarySoft: string;
    primaryDeep: string;
    primaryGlow: string;
    gradient: string;
}

export function hexToAccentTokens(hex: string): AccentTokens {
    let clean = (hex || '').replace('#', '').trim();
    if (clean.length === 3) {
        clean = clean.split('').map((c) => c + c).join('');
    }
    if (!/^[0-9A-Fa-f]{6}$/.test(clean)) {
        clean = '6366f1';
    }
    const num = parseInt(clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;

    const rSoft = Math.min(255, Math.round(r + (255 - r) * 0.28));
    const gSoft = Math.min(255, Math.round(g + (255 - g) * 0.28));
    const bSoft = Math.min(255, Math.round(b + (255 - b) * 0.28));

    const rDeep = Math.max(0, Math.round(r * 0.76));
    const gDeep = Math.max(0, Math.round(g * 0.76));
    const bDeep = Math.max(0, Math.round(b * 0.76));

    const primary = `#${clean.toUpperCase()}`;
    const primarySoft = `rgb(${rSoft}, ${gSoft}, ${bSoft})`;
    const primaryDeep = `rgb(${rDeep}, ${gDeep}, ${bDeep})`;
    const primaryGlow = `rgba(${r}, ${g}, ${b}, 0.4)`;
    const gradient = `linear-gradient(135deg, ${primary} 0%, ${primaryDeep} 100%)`;

    return {
        primary,
        primarySoft,
        primaryDeep,
        primaryGlow,
        gradient,
    };
}

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    private platformId = inject(PLATFORM_ID);
    private readonly THEME_KEY = 'fintrack_theme';
    private readonly ACCENT_KEY = 'fintrack_accent';
    private readonly CUSTOM_HEX_KEY = 'fintrack_custom_accent';

    theme = signal<Theme>(this.loadTheme());
    accentColor = signal<AccentColor>(this.loadAccent());
    customHex = signal<string>(this.loadCustomHex());

    constructor() {
        effect(() => {
            const t = this.theme();
            this.applyTheme(t);
            localStorage.setItem(this.THEME_KEY, t);
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

    setCustomAccent(hex: string): void {
        const normalized = hex.startsWith('#') ? hex : `#${hex}`;
        if (/^#[0-9A-Fa-f]{6}$/.test(normalized) || /^#[0-9A-Fa-f]{3}$/.test(normalized)) {
            this.customHex.set(normalized.toUpperCase());
            if (isPlatformBrowser(this.platformId)) {
                localStorage.setItem(this.CUSTOM_HEX_KEY, normalized.toUpperCase());
            }
            this.accentColor.set('custom');
            this.applyAccent('custom', this.theme());
        }
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
        // Contract attribute used by the shared palette spec.
        html.setAttribute('data-theme', theme);
    }

    private applyAccent(color: AccentColor, theme: Theme = this.theme()): void {
        if (!isPlatformBrowser(this.platformId)) return;
        const root = document.documentElement;

        if (color === 'custom') {
            const tokens = hexToAccentTokens(this.customHex());
            this.writeCssTokens(root, tokens);
            return;
        }

        // Light mode brand is indigo; Cosmic Teal is dark-only optional.
        const effective: AccentColor = theme === 'light' && color === 'teal' ? 'indigo' : color;

        const accents: Record<PresetAccent, AccentTokens> = {
            indigo: {
                primary: '#6366F1',
                primarySoft: '#818cf8',
                primaryDeep: '#4F46E5',
                primaryGlow:
                    theme === 'light' ? 'rgba(99, 102, 241, 0.28)' : 'rgba(99, 102, 241, 0.4)',
                gradient:
                    theme === 'light'
                        ? 'linear-gradient(135deg, #6366F1 0%, #7c3aed 100%)'
                        : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            },
            cyan: {
                primary: theme === 'light' ? '#7c3aed' : '#06B6D4',
                primarySoft: theme === 'light' ? '#8b5cf6' : '#22d3ee',
                primaryDeep: theme === 'light' ? '#6d28d9' : '#0891b2',
                primaryGlow:
                    theme === 'light' ? 'rgba(124, 58, 237, 0.28)' : 'rgba(6, 182, 212, 0.4)',
                gradient:
                    theme === 'light'
                        ? 'linear-gradient(135deg, #7c3aed 0%, #6366F1 100%)'
                        : 'linear-gradient(135deg, #06B6D4 0%, #6366F1 100%)',
            },
            emerald: {
                primary: '#10B981',
                primarySoft: '#34d399',
                primaryDeep: '#059669',
                primaryGlow: 'rgba(16, 185, 129, 0.4)',
                gradient: 'linear-gradient(135deg, #10B981 0%, #6366F1 100%)',
            },
            rose: {
                primary: '#EF4444',
                primarySoft: '#f87171',
                primaryDeep: '#dc2626',
                primaryGlow: 'rgba(239, 68, 68, 0.4)',
                gradient: 'linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)',
            },
            amber: {
                primary: '#F59E0B',
                primarySoft: '#fbbf24',
                primaryDeep: '#d97706',
                primaryGlow: 'rgba(245, 158, 11, 0.4)',
                gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
            },
            teal: {
                primary: '#1b6b8a',
                primarySoft: '#2484aa',
                primaryDeep: '#155a74',
                primaryGlow: 'rgba(27, 107, 138, 0.4)',
                gradient: 'linear-gradient(135deg, #1b6b8a 0%, #2484aa 100%)',
            },
            purple: {
                primary: '#8B5CF6',
                primarySoft: '#A78BFA',
                primaryDeep: '#6D28D9',
                primaryGlow: 'rgba(139, 92, 246, 0.4)',
                gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            },
            fuchsia: {
                primary: '#D946EF',
                primarySoft: '#E879F9',
                primaryDeep: '#A21CAF',
                primaryGlow: 'rgba(217, 70, 239, 0.4)',
                gradient: 'linear-gradient(135deg, #D946EF 0%, #8B5CF6 100%)',
            },
            sky: {
                primary: '#0EA5E9',
                primarySoft: '#38BDF8',
                primaryDeep: '#0369A1',
                primaryGlow: 'rgba(14, 165, 233, 0.4)',
                gradient: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
            },
            lime: {
                primary: '#84CC16',
                primarySoft: '#A3E635',
                primaryDeep: '#4D7C0F',
                primaryGlow: 'rgba(132, 204, 22, 0.4)',
                gradient: 'linear-gradient(135deg, #84CC16 0%, #10B981 100%)',
            },
            coral: {
                primary: '#F97316',
                primarySoft: '#FB923C',
                primaryDeep: '#C2410C',
                primaryGlow: 'rgba(249, 115, 22, 0.4)',
                gradient: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
            },
        };

        const a = accents[effective as PresetAccent] || accents.indigo;
        this.writeCssTokens(root, a);
    }

    private writeCssTokens(root: HTMLElement, tokens: AccentTokens): void {
        root.style.setProperty('--primary', tokens.primary);
        root.style.setProperty('--primary-soft', tokens.primarySoft);
        root.style.setProperty('--primary-deep', tokens.primaryDeep);
        root.style.setProperty('--primary-glow', tokens.primaryGlow);
        root.style.setProperty('--gradient-primary', tokens.gradient);
        root.style.setProperty('--color-primary', tokens.primary);
        root.style.setProperty('--color-primary-dark', tokens.primaryDeep);
    }

    private loadTheme(): Theme {
        if (!isPlatformBrowser(this.platformId)) return 'light';
        const stored = localStorage.getItem(this.THEME_KEY);
        return stored === 'light' || stored === 'dark' ? stored : 'light';
    }

    private loadAccent(): AccentColor {
        if (!isPlatformBrowser(this.platformId)) return 'rose';
        const stored = localStorage.getItem(this.ACCENT_KEY);
        if (!stored) {
            return 'rose';
        }
        const valid: AccentColor[] = [
            'teal',
            'indigo',
            'cyan',
            'emerald',
            'rose',
            'amber',
            'purple',
            'fuchsia',
            'sky',
            'lime',
            'coral',
            'custom',
        ];
        return valid.includes(stored as AccentColor) ? (stored as AccentColor) : 'rose';
    }

    private loadCustomHex(): string {
        if (!isPlatformBrowser(this.platformId)) return '#8B5CF6';
        return localStorage.getItem(this.CUSTOM_HEX_KEY) || '#8B5CF6';
    }
}
