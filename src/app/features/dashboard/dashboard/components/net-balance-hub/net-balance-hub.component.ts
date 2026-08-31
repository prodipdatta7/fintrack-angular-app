import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
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
    PIE_OUTER_R,
    PIE_SIZE,
    buildPieSlices,
    pieTooltipAnchor,
} from '../../../../../shared/utils/pie-geometry';
import { AccountIconComponent } from '../../../../../shared/components/account-icon/account-icon.component';
import { DonutChartComponent } from '../../../../../shared/components/charts/donut-chart/donut-chart.component';
import { FlowChartComponent } from '../../../../../shared/components/charts/flow-chart/flow-chart.component';
import { GaugeChartComponent } from '../../../../../shared/components/charts/gauge-chart/gauge-chart.component';
import { DonutSlice, FlowStream } from '../../../../../shared/components/charts/chart.types';
import { TimeframeSelectorComponent } from '../../../../../shared/components/timeframe-selector/timeframe-selector.component';
import { Timeframe } from '../../../../../core/models/dashboard.model';

@Component({
    selector: 'app-net-balance-hub',
    standalone: true,
    imports: [
        AppCurrencyPipe,
        FormsModule,
        AccountIconComponent,
        DonutChartComponent,
        FlowChartComponent,
        GaugeChartComponent,
        TimeframeSelectorComponent,
    ],
    templateUrl: './net-balance-hub.component.html',
    styleUrl: './net-balance-hub.component.scss',
})
export class NetBalanceHubComponent {
    readonly isLoading = input(false);
    readonly showTimeframeSwitch = input(true);
    readonly timeframes = input<Timeframe[]>(['7D', '15D', '30D', 'This Month', '6M', 'This Year']);
    readonly activeTimeframe = input<Timeframe>('This Month');
    readonly timeframeChange = output<Timeframe>();

    private readonly accountService = inject(AccountService);
    private readonly toast = inject(ToastService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    readonly accounts = this.accountService.accounts;
    readonly totalBalance = this.accountService.totalBalance;

    readonly visualMode = signal<'donut' | 'flow' | 'gauge'>('donut');
    readonly filterTab = signal<'all' | 'active'>('all');
    readonly searchQuery = signal('');
    readonly editingId = signal<string | null>(null);
    readonly draftBalance = signal('');
    readonly isSaving = signal(false);
    readonly hoveredId = signal<string | null>(null);
    readonly isExpanded = signal(false);

    readonly pieViewBox = `0 0 ${PIE_SIZE} ${PIE_SIZE}`;
    readonly holeRadius = PIE_INNER_R;
    readonly centerX = PIE_CX;
    readonly centerY = PIE_CY;

    readonly activeSourcesCount = computed(() => {
        return this.accounts().filter((a) => Number(a.balance) > 0).length;
    });

    readonly liquidityHealthPercent = computed(() => {
        const total = this.accounts().length;
        if (total === 0) return 0;
        return Math.round((this.activeSourcesCount() / total) * 100);
    });

    readonly cards = computed(() => {
        const total = this.totalBalance();
        return this.accounts().map((account) => ({
            account,
            share: total > 0 ? Math.round((Number(account.balance) / total) * 100) : 0,
        }));
    });

    readonly filteredCards = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        const tab = this.filterTab();
        const total = this.totalBalance();

        return this.accounts()
            .filter((account) => {
                const matchesQuery =
                    !query ||
                    account.name.toLowerCase().includes(query) ||
                    (account.accountType && account.accountType.toLowerCase().includes(query));
                const bal = Number(account.balance);
                if (tab === 'active') {
                    return matchesQuery && bal > 0;
                }
                return matchesQuery;
            })
            .map((account) => ({
                account,
                share: total > 0 ? Math.round((Number(account.balance) / total) * 100) : 0,
            }));
    });

    /** Maximum 4 sources shown initially; full list shown when expanded. */
    readonly visibleCards = computed(() => {
        const list = this.filteredCards();
        return this.isExpanded() ? list : list.slice(0, 4);
    });

    readonly hasMoreSources = computed(() => this.filteredCards().length > 4);

    readonly expandableCount = computed(() => {
        return Math.max(0, this.filteredCards().length - 4);
    });

    /** Standardized Donut slices for accounts with balance > 0. */
    readonly donutSlices = computed<DonutSlice[]>(() => {
        const total = this.totalBalance();
        return this.accounts()
            .filter((account) => Number(account.balance) > 0)
            .map((account) => {
                const bal = Number(account.balance);
                const percent = total > 0 ? Math.round((bal / total) * 100) : 0;
                return {
                    id: account.id,
                    name: account.name,
                    value: bal,
                    percent,
                    color: account.color,
                    icon: account.icon,
                };
            });
    });

    /** Flow streams for Particle Flow visualizer mode. */
    readonly flowStreams = computed<FlowStream[]>(() => {
        const total = this.totalBalance();
        return this.accounts()
            .filter((account) => Number(account.balance) > 0)
            .map((account) => {
                const bal = Number(account.balance);
                const percent = total > 0 ? Math.round((bal / total) * 100) : 0;
                return {
                    id: account.id,
                    name: account.name,
                    percent,
                    color: account.color,
                    value: bal,
                    icon: account.icon,
                };
            });
    });

    /** Slices accessor for backward-compatibility. */
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
        return `Balance distribution: ${slices.map((slice) => `${slice.name} ${slice.percent}%`).join(', ')}`;
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

    onTimeframeChange(tf: Timeframe): void {
        this.timeframeChange.emit(tf);
    }

    setVisualMode(mode: 'donut' | 'flow' | 'gauge'): void {
        this.visualMode.set(mode);
    }

    setFilterTab(tab: 'all' | 'active'): void {
        this.filterTab.set(tab);
    }

    onSearchInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.searchQuery.set(target.value);
    }

    clearSearch(): void {
        this.searchQuery.set('');
    }

    onSliceEnter(id: string): void {
        this.hoveredId.set(id);
    }

    onSliceLeave(): void {
        this.hoveredId.set(null);
    }

    onCardEnter(id: string): void {
        if (this.donutSlices().some((slice) => slice.id === id)) {
            this.hoveredId.set(id);
        }
    }
}
