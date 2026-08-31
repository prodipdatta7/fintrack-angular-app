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

    it('should show open accounts by default and show closed when status filter is updated', () => {
        expect(fixture.nativeElement.querySelectorAll('.account-card').length).toBe(2);

        component.draftStatusFilter.set('all');
        component.applyFilters();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('.account-card').length).toBe(3);
        expect(fixture.nativeElement.querySelectorAll('.chip-closed').length).toBe(1);

        component.draftStatusFilter.set('closed');
        component.applyFilters();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('.account-card').length).toBe(1);
    });

    it('should filter by account type', () => {
        accounts.set([
            { ...account('acc-1', 'Salary Account', 'City Bank'), accountType: 'Bank' },
            { ...account('acc-2', 'bKash Wallet', 'bKash'), accountType: 'MFS' },
            { ...account('acc-3', 'Pocket Cash', 'Cash'), accountType: 'Cash' },
        ]);
        fixture.detectChanges();

        component.draftAccountTypeFilter.set('MFS');
        component.applyFilters();
        fixture.detectChanges();

        expect(component.cards().length).toBe(1);
        expect(component.cards()[0].account.name).toBe('bKash Wallet');
    });

    it('should filter by min and max balance range', () => {
        accounts.set([
            { ...account('acc-1', 'Small Account'), balance: 50 },
            { ...account('acc-2', 'Medium Account'), balance: 500 },
            { ...account('acc-3', 'Large Account'), balance: 5000 },
        ]);
        fixture.detectChanges();

        component.draftMinBalance.set('100');
        component.draftMaxBalance.set('1000');
        component.applyFilters();
        fixture.detectChanges();

        expect(component.cards().length).toBe(1);
        expect(component.cards()[0].account.name).toBe('Medium Account');
    });

    it('should sort accounts by balance and name', () => {
        accounts.set([
            { ...account('acc-1', 'Beta Account'), balance: 100 },
            { ...account('acc-2', 'Alpha Account'), balance: 500 },
            { ...account('acc-3', 'Gamma Account'), balance: 300 },
        ]);
        fixture.detectChanges();

        component.draftSortOption.set('balance-desc');
        component.applyFilters();
        expect(component.cards().map((c) => c.account.name)).toEqual([
            'Alpha Account',
            'Gamma Account',
            'Beta Account',
        ]);

        component.draftSortOption.set('name-desc');
        component.applyFilters();
        expect(component.cards().map((c) => c.account.name)).toEqual([
            'Gamma Account',
            'Beta Account',
            'Alpha Account',
        ]);
    });

    it('should isolate draft filters until apply is called', () => {
        component.onFiltersOpenChange(true);
        expect(component.filtersOpen).toBeTrue();

        component.draftAccountTypeFilter.set('Cash');
        // Not applied yet
        expect(component.accountTypeFilter()).toBe('all');

        component.applyFilters();
        expect(component.accountTypeFilter()).toBe('Cash');
        expect(component.activeFiltersCount()).toBeGreaterThan(0);
        expect(component.isFilterActive()).toBeTrue();
    });

    it('should reset all filters and search on resetAllFilters', () => {
        component.searchText.set('test');
        component.accountTypeFilter.set('Bank');
        component.minBalance.set('100');

        component.resetAllFilters();
        expect(component.searchText()).toBe('');
        expect(component.accountTypeFilter()).toBe('all');
        expect(component.minBalance()).toBe('');
        expect(component.statusFilter()).toBe('open');
        expect(component.activeFiltersCount()).toBe(0);
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

    it('should compute account pie slices for open accounts with positive balance', () => {
        const slices = component.accountSlices();
        expect(slices.length).toBe(2);
        expect(slices[0].id).toBe('acc-1');
        expect(slices[0].percent).toBe(50);
        expect(slices[1].id).toBe('acc-2');
        expect(slices[1].percent).toBe(50);
    });

    it('should toggle active slice on select', () => {
        expect(component.activeSliceId()).toBeNull();
        component.onSliceSelect('acc-1');
        expect(component.activeSliceId()).toBe('acc-1');
        expect(component.activeSliceInfo()?.name).toBe('Salary Account');

        // Clicking again deselects
        component.onSliceSelect('acc-1');
        expect(component.activeSliceId()).toBeNull();
    });

    it('should render source balances pie chart SVG in the hero section', () => {
        const svg = fixture.nativeElement.querySelector('.account-pie-svg');
        expect(svg).toBeTruthy();
        const slices = fixture.nativeElement.querySelectorAll('.account-pie-slice');
        expect(slices.length).toBe(2);
    });
});
