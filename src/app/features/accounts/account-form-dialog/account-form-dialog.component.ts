import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
    isLogoPath,
    providersForType,
    type AccountProviderDef,
} from '../../../core/data/account-providers';
import { AccountIconComponent } from '../../../shared/components/account-icon/account-icon.component';
import { IconStoreMenuComponent } from '../../../shared/components/icon-store-menu/icon-store-menu.component';
import { isMaterialIconName } from '../../../shared/data/icon-store';

@Component({
    selector: 'app-account-form-dialog',
    standalone: true,
    imports: [
        DecimalPipe,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        AccountIconComponent,
        IconStoreMenuComponent,
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
    stepIndex = 0;
    readonly customProviderId = CUSTOM_PROVIDER_ID;

    readonly steps: { id: 'type' | 'identity' | 'finish'; title: string; description: string }[] = [
        { id: 'type', title: 'Type', description: 'Choose how this account holds money' },
        { id: 'identity', title: 'Identity', description: 'Provider, name, and icon' },
        { id: 'finish', title: 'Finish', description: 'Currency, balance, and accent' },
    ];

    readonly typeOptions: AccountType[] = ['Bank', 'MFS', 'Cash', 'Credit'];
    readonly typeCards: { value: AccountType; label: string; icon: string; hint: string }[] = [
        { value: 'Bank', label: 'Bank', icon: 'account_balance', hint: 'Checking & savings' },
        { value: 'MFS', label: 'MFS', icon: 'phone_iphone', hint: 'Mobile wallets' },
        { value: 'Cash', label: 'Cash', icon: 'payments', hint: 'On-hand cash' },
        { value: 'Credit', label: 'Credit', icon: 'credit_card', hint: 'Cards & lines' },
    ];
    readonly colorPresets = [
        '#6366F1',
        '#06B6D4',
        '#10B981',
        '#EF4444',
        '#F59E0B',
        '#8B5CF6',
        '#EC4899',
        '#E2136E',
    ];
    readonly currencyOptions = ['BDT', 'USD', 'EUR', 'GBP'];
    providerOptions: AccountProviderDef[] = providersForType('Bank');

    form = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(60)]],
        accountType: ['Bank' as AccountType, Validators.required],
        providerId: [CUSTOM_PROVIDER_ID, Validators.required],
        provider: [''],
        icon: ['account_balance', Validators.required],
        color: ['#6366F1', Validators.required],
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

    get usesCustomIcon(): boolean {
        const icon = this.form.value.icon?.trim() ?? '';
        return !!icon && !isLogoPath(icon);
    }

    get usesMaterialIcon(): boolean {
        return isMaterialIconName(this.form.value.icon);
    }

    get selectedProviderLogo(): string | null {
        if (this.isCustomProvider) return null;
        return findProviderById(this.form.value.providerId)?.logo ?? null;
    }

    get currentStep() {
        return this.steps[this.stepIndex];
    }

    get isLastStep(): boolean {
        return this.stepIndex >= this.steps.length - 1;
    }

    get canProceed(): boolean {
        const value = this.form.value;
        switch (this.currentStep.id) {
            case 'type':
                return !!value.accountType;
            case 'identity': {
                const named = !!value.name?.trim();
                const iconOk = !this.isCustomProvider || !!value.icon?.trim();
                return named && !!value.providerId && iconOk;
            }
            case 'finish':
                return this.form.valid;
            default:
                return false;
        }
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
        this.stepIndex = 0;
        if (this.account) {
            const matched = findProvider(this.account);
            this.refreshProviderOptions(this.account.accountType);
            this.form.patchValue({
                name: this.account.name,
                accountType: this.account.accountType,
                providerId: matched?.id ?? CUSTOM_PROVIDER_ID,
                provider: this.account.provider || matched?.name || '',
                icon: this.account.icon || matched?.logo || 'account_balance',
                color: this.account.color || matched?.color || '#6366F1',
                currency: this.account.currency || this.currencyStore.currencyCode(),
            });
        } else {
            this.resetForm();
        }
    }

    selectAccountType(type: AccountType): void {
        this.form.patchValue({ accountType: type });
        this.onAccountTypeChange(type);
    }

    selectIcon(icon: string): void {
        this.form.patchValue({ icon });
    }

    setAccentColor(color: string): void {
        const next = (color || '').trim();
        if (!/^#[0-9a-fA-F]{6}$/.test(next)) return;
        this.form.patchValue({ color: next });
    }

    goToStep(index: number): void {
        if (index < 0 || index > this.stepIndex) return;
        this.stepIndex = index;
        this.errorMessage = '';
    }

    next(): void {
        if (!this.canProceed || this.isLastStep) return;
        this.stepIndex += 1;
        this.errorMessage = '';
    }

    back(): void {
        if (this.stepIndex === 0) return;
        this.stepIndex -= 1;
        this.errorMessage = '';
    }

    onFormSubmit(): void {
        if (!this.isLastStep) {
            this.next();
            return;
        }
        this.submit();
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
            Bank: { icon: 'account_balance', color: '#6366F1', provider: '' },
            MFS: { icon: 'phone_iphone', color: '#E2136E', provider: '' },
            Cash: { icon: 'payments', color: '#10B981', provider: 'Cash' },
            Credit: { icon: 'credit_card', color: '#4F46E5', provider: '' },
        };
        const next = defaults[type] ?? defaults.Bank;
        this.form.patchValue(next);
    }

    private resetForm(): void {
        this.stepIndex = 0;
        this.refreshProviderOptions('Bank');
        this.form.reset({
            name: '',
            accountType: 'Bank',
            providerId: CUSTOM_PROVIDER_ID,
            provider: '',
            icon: 'account_balance',
            color: '#6366F1',
            currency: this.currencyStore.currencyCode(),
            balance: 0,
        });
    }
}
