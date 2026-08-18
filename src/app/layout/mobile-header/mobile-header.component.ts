import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
    selector: 'app-mobile-header',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './mobile-header.component.html',
    styleUrl: './mobile-header.component.scss',
})
export class MobileHeaderComponent {
    readonly authService = inject(AuthService);
    readonly themeService = inject(ThemeService);

    readonly title = input<string>('FinTrack');
    readonly menuClick = output<void>();

    get initials(): string {
        const email = this.authService.currentUser()?.email || '';
        const part = email.split('@')[0] || '?';
        const first = part[0]?.toUpperCase() || '?';
        const second = part.slice(1).includes('.') ? part.split('.').pop()?.[0]?.toUpperCase() || '' : '';
        return second ? first + second : first;
    }

    onMenuToggle(): void {
        this.menuClick.emit();
    }
}
