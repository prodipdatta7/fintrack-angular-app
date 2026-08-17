import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { Router } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Account, AccountType } from '../../../core/models/account.model';
import { AccountFormDialogComponent } from '../account-form-dialog/account-form-dialog.component';
import { AccountIconComponent } from '../../../shared/components/account-icon/account-icon.component';
import { FilterPopoverComponent } from '../../../shared/components/filter-popover/filter-popover.component';

export type AccountSort = 'name-asc' | 'name-desc' | 'balance-desc' | 'balance-asc' | 'share-desc';
export type AccountStatusFilter = 'all' | 'open' | 'closed';

@Component({
    selector: 'app-account-list',
    standalone: true,
    imports: [
        AppCurrencyPipe,
        FormsModule,
        MatSelectModule,
        AccountFormDialogComponent,
        AccountIconComponent,
        FilterPopoverComponent,
    ],
    templateUrl: './account-list.component.html',
    styleUrl: './account-list.component.scss',
})
export class AccountListComponent implements OnInit {
    readonly accountService = inject(AccountService);
    private readonly confirmDialog = inject(ConfirmDialogService);
    private readonly toast = inject(ToastService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    showDialog = false;
    editingAccount: Account | null = null;
    filtersOpen = false;

    readonly accountTypeOptions: { label: string; value: 'all' | AccountType }[] = [
        { label: 'All Types', value: 'all' },
        { label: 'Banks', value: 'Bank' },
        { label: 'MFS Wallets', value: 'MFS' },
        { label: 'Cash', value: 'Cash' },
        { label: 'Credit', value: 'Credit' },
    ];

    readonly statusOptions: { label: string; value: AccountStatusFilter }[] = [
        { label: 'Open', value: 'open' },
        { label: 'Closed', value: 'closed' },
        { label: 'All Statuses', value: 'all' },
    ];

    readonly searchText = signal('');

    // Applied Filter Signals
    readonly accountTypeFilter = signal<'all' | AccountType>('all');
    readonly statusFilter = signal<AccountStatusFilter>('open');
    readonly sortOption = signal<AccountSort>('name-asc');
    readonly minBalance = signal<string>('');
    readonly maxBalance = signal<string>('');

    // Draft Filter Signals (Isolated inside popover until user clicks Apply)
    readonly draftAccountTypeFilter = signal<'all' | AccountType>('all');
    readonly draftStatusFilter = signal<AccountStatusFilter>('open');
    readonly draftSortOption = signal<AccountSort>('name-asc');
    readonly draftMinBalance = signal<string>('');
    readonly draftMaxBalance = signal<string>('');

    readonly closedCount = computed(() => this.accountService.accounts().filter((a) => a.isClosed).length);

    readonly activeFiltersCount = computed(() => {
        let count = 0;
        if (this.accountTypeFilter() !== 'all') count++;
        if (this.statusFilter() !== 'open') count++;
        if (this.sortOption() !== 'name-asc') count++;
        if (this.minBalance()) count++;
        if (this.maxBalance()) count++;
        return count;
    });

    readonly isFilterActive = computed(() => {
        return !!this.searchText().trim() || this.activeFiltersCount() > 0;
    });

    readonly cards = computed(() => {
        const search = this.searchText().toLowerCase().trim();
        const type = this.accountTypeFilter();
        const status = this.statusFilter();
        const sort = this.sortOption();
        const min = this.minBalance() ? Number(this.minBalance()) : null;
        const max = this.maxBalance() ? Number(this.maxBalance()) : null;

        const filtered = this.accountService.accounts().filter((account) => {
            // Search text
            if (
                search &&
                !account.name.toLowerCase().includes(search) &&
                !account.provider?.toLowerCase().includes(search)
            ) {
                return false;
            }

            // Account Type
            if (type !== 'all' && account.accountType !== type) {
                return false;
            }

            // Status (open / closed / all)
            if (status === 'open' && account.isClosed) {
                return false;
            }
            if (status === 'closed' && !account.isClosed) {
                return false;
            }

            // Min Balance
            if (min !== null && !isNaN(min) && account.balance < min) {
                return false;
            }

            // Max Balance
            if (max !== null && !isNaN(max) && account.balance > max) {
                return false;
            }

            return true;
        });

        return filtered
            .map((account) => ({
                account,
                share: this.accountService.portfolioShare(account.id),
            }))
            .sort((a, b) => {
                switch (sort) {
                    case 'name-desc':
                        return b.account.name.localeCompare(a.account.name);
                    case 'balance-desc':
                        return b.account.balance - a.account.balance;
                    case 'balance-asc':
                        return a.account.balance - b.account.balance;
                    case 'share-desc':
                        return b.share - a.share;
                    case 'name-asc':
                    default:
                        return a.account.name.localeCompare(b.account.name);
                }
            });
    });

    ngOnInit(): void {
        this.reloadAccounts();
    }

    onSearchChange(value: string): void {
        this.searchText.set(value);
    }

    onFiltersOpenChange(open: boolean): void {
        this.filtersOpen = open;
        if (open) {
            this.syncDraftsFromApplied();
        }
    }

    syncDraftsFromApplied(): void {
        this.draftAccountTypeFilter.set(this.accountTypeFilter());
        this.draftStatusFilter.set(this.statusFilter());
        this.draftSortOption.set(this.sortOption());
        this.draftMinBalance.set(this.minBalance());
        this.draftMaxBalance.set(this.maxBalance());
    }

    applyFilters(): void {
        this.accountTypeFilter.set(this.draftAccountTypeFilter());
        this.statusFilter.set(this.draftStatusFilter());
        this.sortOption.set(this.draftSortOption());
        this.minBalance.set(this.draftMinBalance());
        this.maxBalance.set(this.draftMaxBalance());
    }

    resetAllFilters(): void {
        this.draftAccountTypeFilter.set('all');
        this.draftStatusFilter.set('open');
        this.draftSortOption.set('name-asc');
        this.draftMinBalance.set('');
        this.draftMaxBalance.set('');

        this.accountTypeFilter.set('all');
        this.statusFilter.set('open');
        this.sortOption.set('name-asc');
        this.minBalance.set('');
        this.maxBalance.set('');
        this.searchText.set('');
    }

    openAccount(account: Account): void {
        this.router.navigate(['/accounts', account.id]);
    }

    openCreate(): void {
        this.editingAccount = null;
        this.showDialog = true;
    }

    openEdit(account: Account, event: Event): void {
        event.stopPropagation();
        this.editingAccount = account;
        this.showDialog = true;
    }

    onDialogClosed(): void {
        this.editingAccount = null;
    }

    reloadAccounts(): void {
        this.accountService
            .getAccounts(true)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });
    }

    closeAccount(account: Account, event: Event): void {
        event.stopPropagation();
        this.confirmDialog
            .confirmDelete(
                `"${account.name}" will stop counting toward totals. Its history stays readable and you can reopen it later.`,
                'Close account',
            )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((confirmed) => {
                if (!confirmed) return;
                this.accountService
                    .setAccountStatus(account.id, true)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => this.toast.show('Account closed'),
                        error: () => this.toast.error('Could not close the account'),
                    });
            });
    }

    reopenAccount(account: Account, event: Event): void {
        event.stopPropagation();
        this.accountService
            .setAccountStatus(account.id, false)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.toast.show('Account reopened'),
                error: () => this.toast.error('Could not reopen the account'),
            });
    }
}
