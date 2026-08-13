import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { Router } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Account } from '../../../core/models/account.model';
import { AccountFormDialogComponent } from '../account-form-dialog/account-form-dialog.component';
import { AccountIconComponent } from '../../../shared/components/account-icon/account-icon.component';

@Component({
    selector: 'app-account-list',
    standalone: true,
    imports: [AppCurrencyPipe, FormsModule, AccountFormDialogComponent, AccountIconComponent],
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

    readonly searchText = signal('');
    readonly showClosed = signal(false);

    readonly closedCount = computed(() => this.accountService.accounts().filter((a) => a.isClosed).length);

    readonly cards = computed(() => {
        const search = this.searchText().toLowerCase().trim();
        return this.accountService
            .accounts()
            .filter((account) => this.showClosed() || !account.isClosed)
            .filter(
                (account) =>
                    !search ||
                    account.name.toLowerCase().includes(search) ||
                    account.provider.toLowerCase().includes(search),
            )
            .map((account) => ({
                account,
                share: this.accountService.portfolioShare(account.id),
            }));
    });

    ngOnInit(): void {
        this.reloadAccounts();
    }

    onSearchChange(value: string): void {
        this.searchText.set(value);
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
