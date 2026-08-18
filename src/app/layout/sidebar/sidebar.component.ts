import { Component, computed, inject, input, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AccountService } from '../../core/services/account.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ThemeService } from '../../core/services/theme.service';
import { TransactionService } from '../../core/services/transaction.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
    authService = inject(AuthService);
    themeService = inject(ThemeService);
    private readonly accountService = inject(AccountService);
    private readonly categoryService = inject(CategoryService);
    private readonly transactionService = inject(TransactionService);
    private readonly router = inject(Router);

    readonly isOpen = input<boolean>(false);
    readonly close = output<void>();

    readonly transactionCount = computed(() => this.transactionService.totalCount());
    readonly categoryCount = computed(() => this.categoryService.categories().length);
    readonly accountCount = computed(() => this.accountService.accounts().filter((a) => !a.isClosed).length);

    get initials(): string {
        const email = this.authService.currentUser()?.email || '';
        const part = email.split('@')[0] || '?';
        const first = part[0]?.toUpperCase() || '?';
        const second = part.slice(1).includes('.') ? part.split('.').pop()?.[0]?.toUpperCase() || '' : '';
        return second ? first + second : first;
    }

    onNavClick(): void {
        this.close.emit();
    }

    logout(): void {
        this.close.emit();
        void this.authService.logout().then(() => this.router.navigate(['/login']));
    }
}
