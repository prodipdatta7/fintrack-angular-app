import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AccountFormDialogComponent } from './account-form-dialog.component';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../core/services/toast.service';
import { CurrencyStore } from '../../../core/services/currency.store';
import { Account } from '../../../core/models/account.model';

const existing: Account = {
    id: 'acc-1',
    name: 'bKash Wallet',
    accountType: 'MFS',
    balance: 820,
    currency: 'BDT',
    icon: '📱',
    provider: 'bKash',
    color: '#e2136e',
    isClosed: false,
    createdAt: '2026-01-10T00:00:00Z',
};

describe('AccountFormDialogComponent', () => {
    let fixture: ComponentFixture<AccountFormDialogComponent>;
    let component: AccountFormDialogComponent;
    let accountServiceSpy: jasmine.SpyObj<AccountService>;
    let toastService: ToastService;
    let savedCount: number;

    beforeEach(async () => {
        accountServiceSpy = jasmine.createSpyObj('AccountService', ['createAccount', 'updateAccount']);
        accountServiceSpy.createAccount.and.returnValue(of('acc-new'));
        accountServiceSpy.updateAccount.and.returnValue(of(void 0));

        await TestBed.configureTestingModule({
            imports: [AccountFormDialogComponent, NoopAnimationsModule],
            providers: [
                ToastService,
                CurrencyStore,
                { provide: AccountService, useValue: accountServiceSpy },
            ],
        }).compileComponents();

        toastService = TestBed.inject(ToastService);
        TestBed.inject(CurrencyStore).setCurrency('BDT');
        fixture = TestBed.createComponent(AccountFormDialogComponent);
        component = fixture.componentInstance;
        savedCount = 0;
        component.saved.subscribe(() => savedCount++);
    });

    afterEach(() => toastService.clear());

    const open = (account: Account | null = null) => {
        component.visible = true;
        component.account = account;
        component.ngOnChanges({ visible: { currentValue: true } as never });
        fixture.detectChanges();
    };

    it('should open in create mode with the defaults and a balance field', () => {
        open();
        expect(component.isEditMode).toBeFalse();
        expect(component.form.value.icon).toBe('🏦');
        expect(component.form.value.accountType).toBe('Bank');
        expect(component.form.value.currency).toBe('BDT');
        expect(fixture.nativeElement.querySelector('.modal-header h3').textContent).toContain('Add Account');
        expect(fixture.nativeElement.querySelector('input[formcontrolname="balance"]')).toBeTruthy();
    });

    it('should prefill in edit mode and hide the balance field', () => {
        open(existing);
        expect(component.isEditMode).toBeTrue();
        expect(component.form.value.name).toBe('bKash Wallet');
        expect(component.form.value.accountType).toBe('MFS');
        expect(fixture.nativeElement.querySelector('.modal-header h3').textContent).toContain('Edit Account');
        expect(fixture.nativeElement.querySelector('input[formcontrolname="balance"]')).toBeNull();
    });

    it('should apply the official provider logo and brand color when a provider is picked', () => {
        open();
        component.form.patchValue({ accountType: 'MFS' });
        component.onAccountTypeChange('MFS');
        component.onProviderPick('bkash');

        expect(component.form.value.providerId).toBe('bkash');
        expect(component.form.value.provider).toBe('bKash');
        expect(component.form.value.icon).toBe('/providers/bkash.svg');
        expect(component.form.value.color).toBe('#E2136E');
        expect(component.form.value.name).toBe('bKash');
    });

    it('should create an account with the opening balance and emit saved', () => {
        open();
        component.onProviderPick('cash');
        component.form.patchValue({ name: 'Cash in Hand', balance: 250 });
        component.submit();

        expect(accountServiceSpy.createAccount).toHaveBeenCalledWith({
            name: 'Cash in Hand',
            accountType: 'Cash',
            provider: 'Cash',
            icon: '/providers/cash.svg',
            color: '#2ECC71',
            currency: 'BDT',
            balance: 250,
        });
        expect(toastService.toasts()[0].message).toBe('New account added');
        expect(savedCount).toBe(1);
        expect(component.visible).toBeFalse();
    });

    it('should update an existing account without sending a balance', () => {
        open(existing);
        component.form.patchValue({ name: 'bKash Personal' });
        component.submit();

        expect(accountServiceSpy.updateAccount).toHaveBeenCalledWith(
            jasmine.objectContaining({ id: 'acc-1', name: 'bKash Personal' }),
        );
        const payload = accountServiceSpy.updateAccount.calls.mostRecent().args[0] as unknown as Record<
            string,
            unknown
        >;
        expect('balance' in payload).toBeFalse();
        expect(toastService.toasts()[0].message).toBe('Account updated');
    });

    it('should not submit without a name', () => {
        open();
        component.form.patchValue({ name: '' });
        component.submit();
        expect(accountServiceSpy.createAccount).not.toHaveBeenCalled();
    });

    it('should surface a server error without closing', () => {
        open();
        accountServiceSpy.createAccount.and.returnValue(
            throwError(() => ({ error: { error: 'Account type must be one of: Bank, MFS, Cash, Credit.' } })),
        );

        component.form.patchValue({ name: 'Broken' });
        component.submit();

        expect(component.errorMessage).toBe('Account type must be one of: Bank, MFS, Cash, Credit.');
        expect(component.visible).toBeTrue();
        expect(savedCount).toBe(0);
    });
});
