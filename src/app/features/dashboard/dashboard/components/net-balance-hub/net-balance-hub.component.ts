import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Account } from '../../../../../core/models/account.model';
import { AccountService } from '../../../../../core/services/account.service';
import { ToastService } from '../../../../../core/services/toast.service';
import {
    PIE_CX,
    PIE_CY,
    PIE_INNER_R,
    PIE_SIZE,
    buildPieSlices,
    pieTooltipAnchor,
} from '../../../../../shared/utils/pie-geometry';
import { AccountIconComponent } from '../../../../../shared/components/account-icon/account-icon.component';

@Component({
    selector: 'app-net-balance-hub',
    standalone: true,
    imports: [AppCurrencyPipe, FormsModule, AccountIconComponent],
    templateUrl: './net-balance-hub.component.html',
    styleUrl: './net-balance-hub.component.scss',
})
export class NetBalanceHubComponent {
    readonly isLoading = input(false);

    private readonly accountService = inject(AccountService);
    private readonly toast = inject(ToastService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    readonly accounts = this.accountService.accounts;
    readonly totalBalance = this.accountService.totalBalance;

    readonly editingId = signal<string | null>(null);
    readonly draftBalance = signal('');
    readonly isSaving = signal(false);
    readonly hoveredId = signal<string | null>(null);
    readonly isExpanded = signal(false);

    readonly pieViewBox = `0 0 ${PIE_SIZE} ${PIE_SIZE}`;
    readonly holeRadius = PIE_INNER_R - 1;
    readonly centerX = PIE_CX;
    readonly centerY = PIE_CY;

    readonly cards = computed(() => {
        const total = this.totalBalance();
        return this.accounts().map((account) => ({
            account,
            share: total > 0 ? Math.round((Number(account.balance) / total) * 100) : 0,
        }));
    });

    /** Maximum 4 sources shown initially; full list shown when expanded. */
    readonly visibleCards = computed(() => {
        const all = this.cards();
        return this.isExpanded() ? all : all.slice(0, 4);
    });

    readonly hasMoreSources = computed(() => this.cards().length > 4);

    /** Donut slices for accounts with remaining balance — colors match each source. */
    readonly slices = computed(() => {
        const byId = new Map(this.accounts().map((account) => [account.id, account]));
        return buildPieSlices(
            this.accounts()
                .filter((account) => Number(account.balance) > 0)
                .map((account) => ({
                    id: account.id,
                    value: Number(account.balance),
                    color: account.color,
                })),
        ).map((slice) => {
            const account = byId.get(slice.id);
            return {
                ...slice,
                name: account?.name ?? slice.id,
                icon: account?.icon ?? '',
            };
        });
    });

    readonly hovered = computed(() => {
        const id = this.hoveredId();
        if (!id) return null;
        const slice = this.slices().find((entry) => entry.id === id);
        if (!slice) return null;
        const anchor = pieTooltipAnchor(slice.midAngle);
        return {
            name: slice.name,
            icon: slice.icon,
            balance: slice.value,
            percent: slice.percent,
            color: slice.color,
            left: anchor.left,
            top: anchor.top,
        };
    });

    readonly summaryLabel = computed(() => {
        const slices = this.slices();
        if (!slices.length) return 'No account balances to chart';
        return `Portfolio liquidity: ${slices.map((slice) => `${slice.name} ${slice.percent}%`).join(', ')}`;
    });

    toggleExpanded(): void {
        this.isExpanded.update((v) => !v);
    }

    openAccount(account: Account): void {
        if (this.editingId()) return;
        this.router.navigate(['/accounts', account.id]);
    }

    goToAccounts(): void {
        this.router.navigate(['/accounts']);
    }

    startEdit(account: Account, event: Event): void {
        event.stopPropagation();
        this.editingId.set(account.id);
        this.draftBalance.set(String(account.balance));
    }

    cancelEdit(event: Event): void {
        event.stopPropagation();
        this.editingId.set(null);
    }

    saveEdit(account: Account, event: Event): void {
        event.stopPropagation();
        const parsed = Number(this.draftBalance());
        if (!Number.isFinite(parsed) || parsed < 0) {
            this.toast.error('Enter a valid balance');
            return;
        }

        this.isSaving.set(true);
        this.accountService
            .updateBalance(account.id, parsed)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.isSaving.set(false);
                    this.editingId.set(null);
                    this.toast.show('Account balance adjusted');
                },
                error: () => {
                    this.isSaving.set(false);
                    this.toast.error('Could not update the balance');
                },
            });
    }

    onSliceEnter(id: string): void {
        this.hoveredId.set(id);
    }

    onSliceLeave(): void {
        this.hoveredId.set(null);
    }

    onCardEnter(id: string): void {
        if (this.slices().some((slice) => slice.id === id)) {
            this.hoveredId.set(id);
        }
    }
}
