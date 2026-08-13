import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AccountListComponent } from './account-list.component';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Account } from '../../../core/models/account.model';

const account = (id: string, name: string, provider = '', isClosed = false): Account => ({
    id,
    name,
    accountType: 'Bank',
    balance: 500,
    currency: 'USD',
    icon: '🏦',
    provider,
    color: '#6366f1',
    isClosed,
    createdAt: '2026-01-10T00:00:00Z',
});

describe('AccountListComponent', () => {
    let fixture: ComponentFixture<AccountListComponent>;
    let component: AccountListComponent;
    let accounts: ReturnType<typeof signal<Account[]>>;
    let accountServiceSpy: jasmine.SpyObj<AccountService>;
    let confirmDialogSpy: jasmine.SpyObj<ConfirmDialogService>;

    beforeEach(async () => {
        accounts = signal<Account[]>([
            account('acc-1', 'Salary Account', 'City Bank'),
            account('acc-2', 'bKash Wallet', 'bKash'),
            account('acc-3', 'Old Savings', '', true),
        ]);

        accountServiceSpy = jasmine.createSpyObj(
            'AccountService',
            ['getAccounts', 'setAccountStatus', 'portfolioShare'],
            { accounts, isLoading: signal(false), totalBalance: signal(1000) },
        );
        accountServiceSpy.getAccounts.and.returnValue(of({ items: [], totalBalance: 0 }));
        accountServiceSpy.setAccountStatus.and.returnValue(of(void 0));
        accountServiceSpy.portfolioShare.and.returnValue(50);

        confirmDialogSpy = jasmine.createSpyObj('ConfirmDialogService', ['confirmDelete']);
        confirmDialogSpy.confirmDelete.and.returnValue(of(true));

        await TestBed.configureTestingModule({
            imports: [AccountListComponent, NoopAnimationsModule],
            providers: [
                ToastService,
                provideRouter([]),
                { provide: AccountService, useValue: accountServiceSpy },
                { provide: ConfirmDialogService, useValue: confirmDialogSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AccountListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should fetch closed accounts too on init', () => {
        expect(accountServiceSpy.getAccounts).toHaveBeenCalledWith(true);
    });

    it('should hide closed accounts until the toggle is on', () => {
        expect(fixture.nativeElement.querySelectorAll('.account-card').length).toBe(2);

        component.showClosed.set(true);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('.account-card').length).toBe(3);
        expect(fixture.nativeElement.querySelectorAll('.chip-closed').length).toBe(1);
    });

    it('should filter by name or provider', () => {
        component.onSearchChange('bkash');
        fixture.detectChanges();
        expect(component.cards().length).toBe(1);
        expect(component.cards()[0].account.id).toBe('acc-2');

        component.onSearchChange('city');
        fixture.detectChanges();
        expect(component.cards().length).toBe(1);
        expect(component.cards()[0].account.id).toBe('acc-1');
    });

    it('should open the dialog in create mode', () => {
        component.openCreate();
        expect(component.showDialog).toBeTrue();
        expect(component.editingAccount).toBeNull();
    });

    it('should open the dialog prefilled in edit mode', () => {
        component.openEdit(accounts()[0], new MouseEvent('click'));
        expect(component.showDialog).toBeTrue();
        expect(component.editingAccount?.id).toBe('acc-1');
    });

    it('should close an account only after confirmation', () => {
        confirmDialogSpy.confirmDelete.and.returnValue(of(false));
        component.closeAccount(accounts()[0], new MouseEvent('click'));
        expect(accountServiceSpy.setAccountStatus).not.toHaveBeenCalled();

        confirmDialogSpy.confirmDelete.and.returnValue(of(true));
        component.closeAccount(accounts()[0], new MouseEvent('click'));
        expect(accountServiceSpy.setAccountStatus).toHaveBeenCalledWith('acc-1', true);
    });

    it('should reopen a closed account without confirmation', () => {
        component.reopenAccount(accounts()[2], new MouseEvent('click'));
        expect(confirmDialogSpy.confirmDelete).not.toHaveBeenCalled();
        expect(accountServiceSpy.setAccountStatus).toHaveBeenCalledWith('acc-3', false);
    });

    it('should navigate to the detail page when a card is clicked', () => {
        const router = TestBed.inject(Router);
        const navigateSpy = spyOn(router, 'navigate');
        component.openAccount(accounts()[0]);
        expect(navigateSpy).toHaveBeenCalledWith(['/accounts', 'acc-1']);
    });

    it('should show an empty state when nothing matches', () => {
        component.onSearchChange('nothing-matches-this');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
    });
});
