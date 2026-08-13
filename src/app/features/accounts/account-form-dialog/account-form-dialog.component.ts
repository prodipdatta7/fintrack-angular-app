import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../core/services/toast.service';
import { CurrencyStore, DEFAULT_CURRENCY } from '../../../core/services/currency.store';
import { Account, AccountType } from '../../../core/models/account.model';
import {
    ACCOUNT_PROVIDERS,
    CUSTOM_PROVIDER_ID,
    findProvider,
    findProviderById,
    providersForType,
    type AccountProviderDef,
} from '../../../core/data/account-providers';
import { AccountIconComponent } from '../../../shared/components/account-icon/account-icon.component';

@Component({
    selector: 'app-account-form-dialog',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        AccountIconComponent,
    ],
    templateUrl: './account-form-dialog.component.html',
    styleUrl: './account-form-dialog.component.scss',
})
export class AccountFormDialogComponent implements OnChanges {
    @Input() visible = false;
    /** Non-null puts the dialog into edit mode. */
    @Input() account: Account | null = null;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() saved = new EventEmitter<void>();
    @Output() closed = new EventEmitter<void>();

    private fb = inject(FormBuilder);
    private accountService = inject(AccountService);
    private currencyStore = inject(CurrencyStore);
    private toast = inject(ToastService);
    private destroyRef = inject(DestroyRef);

    errorMessage = '';
    isSubmitting = false;
    readonly customProviderId = CUSTOM_PROVIDER_ID;

    readonly typeOptions: AccountType[] = ['Bank', 'MFS', 'Cash', 'Credit'];
    readonly currencyOptions = ['BDT', 'USD', 'EUR', 'GBP'];
    providerOptions: AccountProviderDef[] = providersForType('Bank');

    form = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(60)]],
        accountType: ['Bank' as AccountType, Validators.required],
        providerId: [CUSTOM_PROVIDER_ID, Validators.required],
        provider: [''],
        icon: ['🏦', Validators.required],
        color: ['#6366f1', Validators.required],
        currency: [DEFAULT_CURRENCY, Validators.required],
        // Only read in create mode — edits go through the inline PATCH /balance flow.
        balance: [0, [Validators.min(0)]],
    });

    get isEditMode(): boolean {
        return !!this.account;
    }

    get isCustomProvider(): boolean {
        return this.form.value.providerId === CUSTOM_PROVIDER_ID;
    }

    get previewProvider(): string {
        return this.form.value.provider || '';
    }

    get previewIcon(): string {
        return this.form.value.icon || '';
    }

    get previewName(): string {
        return this.form.value.name || '';
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['visible'] && !changes['account']) return;
        if (!this.visible) return;

        this.errorMessage = '';
        if (this.account) {
            const matched = findProvider(this.account);
            this.refreshProviderOptions(this.account.accountType);
            this.form.patchValue({
                name: this.account.name,
                accountType: this.account.accountType,
                providerId: matched?.id ?? CUSTOM_PROVIDER_ID,
                provider: this.account.provider || matched?.name || '',
                icon: this.account.icon || matched?.logo || '🏦',
                color: this.account.color || matched?.color || '#6366f1',
                currency: this.account.currency || this.currencyStore.currencyCode(),
            });
        } else {
            this.resetForm();
        }
    }

    onAccountTypeChange(type: AccountType): void {
        this.refreshProviderOptions(type);
        const current = findProviderById(this.form.value.providerId);
        if (current && current.accountType !== type) {
            this.form.patchValue({ providerId: CUSTOM_PROVIDER_ID });
            this.applyCustomDefaults(type);
        }
    }

    onProviderPick(providerId: string): void {
        this.form.patchValue({ providerId });
        if (providerId === CUSTOM_PROVIDER_ID) {
            this.applyCustomDefaults(this.form.value.accountType as AccountType);
            return;
        }

        const provider = findProviderById(providerId);
        if (!provider) return;

        this.refreshProviderOptions(provider.accountType);

        const currentName = this.form.value.name?.trim() ?? '';
        const previousProvider = ACCOUNT_PROVIDERS.find((item) => item.name === this.form.value.provider);
        const shouldReplaceName = !currentName || currentName === previousProvider?.name;

        this.form.patchValue({
            accountType: provider.accountType,
            providerId: provider.id,
            provider: provider.name,
            icon: provider.logo,
            color: provider.color,
            ...(shouldReplaceName ? { name: provider.name } : {}),
        });
    }

    close(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.closed.emit();
    }

    /** Ignore overlay clicks that land on Material select panels (safety net). */
    onOverlayClick(event: MouseEvent): void {
        const target = event.target as HTMLElement | null;
        if (target?.closest('.cdk-overlay-pane, .mat-mdc-select-panel')) {
            return;
        }
        this.close();
    }

    submit(): void {
        if (this.form.invalid) return;

        this.errorMessage = '';
        this.isSubmitting = true;
        const value = this.form.getRawValue();
        const payload = {
            name: value.name!,
            accountType: value.accountType!,
            provider: value.provider ?? '',
            icon: value.icon!,
            color: value.color!,
            currency: value.currency!,
        };

        const request: Observable<unknown> = this.account
            ? this.accountService.updateAccount({ ...payload, id: this.account.id })
            : this.accountService.createAccount({ ...payload, balance: Number(value.balance) || 0 });

        request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.toast.show(this.account ? 'Account updated' : 'New account added');
                this.saved.emit();
                this.resetForm();
                this.close();
            },
            error: (err) => {
                this.isSubmitting = false;
                this.errorMessage = err.error?.error || 'Failed to save account.';
            },
        });
    }

    private refreshProviderOptions(type: AccountType): void {
        this.providerOptions = providersForType(type);
    }

    private applyCustomDefaults(type: AccountType): void {
        const defaults: Record<AccountType, { icon: string; color: string; provider: string }> = {
            Bank: { icon: '🏦', color: '#6366f1', provider: '' },
            MFS: { icon: '📱', color: '#e2136e', provider: '' },
            Cash: { icon: '💵', color: '#2ecc71', provider: 'Cash' },
            Credit: { icon: '💳', color: '#1a1f71', provider: '' },
        };
        const next = defaults[type] ?? defaults.Bank;
        this.form.patchValue(next);
    }

    private resetForm(): void {
        this.refreshProviderOptions('Bank');
        this.form.reset({
            name: '',
            accountType: 'Bank',
            providerId: CUSTOM_PROVIDER_ID,
            provider: '',
            icon: '🏦',
            color: '#6366f1',
            currency: this.currencyStore.currencyCode(),
            balance: 0,
        });
    }
}
