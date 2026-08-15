import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NetBalanceHubComponent } from './net-balance-hub.component';
import { AccountService } from '../../../../../core/services/account.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { CurrencyStore } from '../../../../../core/services/currency.store';
import { Account } from '../../../../../core/models/account.model';

const account = (id: string, balance: number, name = `Account ${id}`, color = '#6366f1'): Account => ({
    id,
    name,
    accountType: 'Bank',
    balance,
    currency: 'BDT',
    icon: '🏦',
    provider: 'City Bank',
    color,
    isClosed: false,
    createdAt: '2026-01-10T00:00:00Z',
});

describe('NetBalanceHubComponent', () => {
    let fixture: ComponentFixture<NetBalanceHubComponent>;
    let component: NetBalanceHubComponent;
    let accounts: ReturnType<typeof signal<Account[]>>;
    let accountServiceSpy: jasmine.SpyObj<AccountService>;
    let toastService: ToastService;
    let router: Router;

    beforeEach(async () => {
        accounts = signal<Account[]>([
            account('acc-1', 7500, 'Checking', '#6366f1'),
            account('acc-2', 2500, 'Savings', '#22c55e'),
        ]);
        accountServiceSpy = jasmine.createSpyObj('AccountService', ['updateBalance'], {
            accounts,
            totalBalance: computed(() => accounts().reduce((sum, a) => sum + a.balance, 0)),
        });
        accountServiceSpy.updateBalance.and.returnValue(of(void 0));

        await TestBed.configureTestingModule({
            imports: [NetBalanceHubComponent],
            providers: [
                provideRouter([]),
                ToastService,
                CurrencyStore,
                { provide: AccountService, useValue: accountServiceSpy },
            ],
        }).compileComponents();

        toastService = TestBed.inject(ToastService);
        TestBed.inject(CurrencyStore).setCurrency('BDT');
        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(NetBalanceHubComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => toastService.clear());

    it('should render the portfolio total and one card per account', () => {
        const host = fixture.nativeElement as HTMLElement;
        const total = host.querySelector('.hub-total')?.textContent?.trim() ?? '';
        expect(total).toContain('10,000.00');
        expect(total).not.toContain('$');
        expect(host.querySelectorAll('.account-card').length).toBe(2);
        expect(host.querySelector('.hub-sources')?.textContent).toContain('2 Accounts');
    });

    it('should compute the portfolio share of each account', () => {
        expect(component.cards().map((c) => c.share)).toEqual([75, 25]);
    });

    it('should guard against a zero portfolio total', () => {
        accounts.set([account('acc-1', 0)]);
        fixture.detectChanges();
        expect(component.cards()[0].share).toBe(0);
    });

    it('should navigate to the account detail page on card click', () => {
        const navigateSpy = spyOn(router, 'navigate');
        (fixture.nativeElement.querySelector('.account-card') as HTMLElement).click();
        expect(navigateSpy).toHaveBeenCalledWith(['/accounts', 'acc-1']);
    });

    it('should save an inline balance edit and raise a toast', () => {
        component.startEdit(accounts()[0], new MouseEvent('click'));
        component.draftBalance.set('8200');
        component.saveEdit(accounts()[0], new MouseEvent('click'));

        expect(accountServiceSpy.updateBalance).toHaveBeenCalledWith('acc-1', 8200);
        expect(component.editingId()).toBeNull();
        expect(toastService.toasts()[0].message).toBe('Account balance adjusted');
    });

    it('should reject an invalid balance without calling the API', () => {
        component.startEdit(accounts()[0], new MouseEvent('click'));
        component.draftBalance.set('-5');
        component.saveEdit(accounts()[0], new MouseEvent('click'));

        expect(accountServiceSpy.updateBalance).not.toHaveBeenCalled();
        expect(toastService.toasts()[0].type).toBe('error');
        expect(component.editingId()).toBe('acc-1');
    });

    it('should report a failed balance update', () => {
        accountServiceSpy.updateBalance.and.returnValue(throwError(() => new Error('boom')));

        component.startEdit(accounts()[0], new MouseEvent('click'));
        component.draftBalance.set('100');
        component.saveEdit(accounts()[0], new MouseEvent('click'));

        expect(toastService.toasts()[0].type).toBe('error');
    });

    it('should not navigate while a card is being edited', () => {
        const navigateSpy = spyOn(router, 'navigate');
        component.startEdit(accounts()[0], new MouseEvent('click'));
        component.openAccount(accounts()[1]);
        expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should show an empty state when there are no accounts', () => {
        accounts.set([]);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
    });

    it('should render a donut slice per account with remaining balance, using account colors', () => {
        const slices = fixture.nativeElement.querySelectorAll('.hud-slice');
        expect(slices.length).toBe(2);
        expect(slices[0].getAttribute('fill')).toBe('#6366f1');
        expect(slices[1].getAttribute('fill')).toBe('#22c55e');
        expect(component.slices().map((s) => s.percent)).toEqual([75, 25]);
    });

    it('should show remaining balance and percent in the hover tooltip', () => {
        const slices = fixture.nativeElement.querySelectorAll('.hud-slice');
        slices[0].dispatchEvent(new MouseEvent('mouseenter'));
        fixture.detectChanges();

        const tooltip = fixture.nativeElement.querySelector('.hud-tooltip') as HTMLElement;
        expect(tooltip).toBeTruthy();
        expect(tooltip.textContent).toContain('Checking');
        expect(tooltip.textContent).toContain('7,500.00');
        expect(tooltip.textContent).not.toContain('$');
        expect(tooltip.textContent).toContain('75%');
    });

    it('should omit zero-balance accounts from the donut', () => {
        accounts.set([account('acc-1', 5000, 'Checking', '#6366f1'), account('acc-2', 0, 'Empty', '#22c55e')]);
        fixture.detectChanges();
        expect(component.slices().map((s) => s.id)).toEqual(['acc-1']);
        expect(fixture.nativeElement.querySelectorAll('.hud-slice').length).toBe(1);
        expect(fixture.nativeElement.querySelectorAll('.account-card').length).toBe(2);
    });

    it('should show 4 sources initially and toggle expand when more sources exist', () => {
        accounts.set([
            account('acc-1', 1000, 'Bank 1'),
            account('acc-2', 2000, 'Bank 2'),
            account('acc-3', 3000, 'Bank 3'),
            account('acc-4', 4000, 'Bank 4'),
            account('acc-5', 5000, 'Bank 5'),
            account('acc-6', 6000, 'Bank 6'),
        ]);
        fixture.detectChanges();

        expect(component.hasMoreSources()).toBeTrue();
        expect(component.visibleCards().length).toBe(4);
        expect(fixture.nativeElement.querySelectorAll('.account-card').length).toBe(4);

        const expandBtn = fixture.nativeElement.querySelector('.btn-matrix-toggle') as HTMLButtonElement;
        expect(expandBtn).toBeTruthy();
        expect(expandBtn.textContent).toContain('Show 2 More Sources');

        expandBtn.click();
        fixture.detectChanges();

        expect(component.isExpanded()).toBeTrue();
        expect(component.visibleCards().length).toBe(6);
        expect(fixture.nativeElement.querySelectorAll('.account-card').length).toBe(6);
        expect(expandBtn.textContent).toContain('Collapse Source Matrix');

        expandBtn.click();
        fixture.detectChanges();

        expect(component.isExpanded()).toBeFalse();
        expect(component.visibleCards().length).toBe(4);
        expect(fixture.nativeElement.querySelectorAll('.account-card').length).toBe(4);
    });

    it('should switch between Spatial Visualizer modes (Donut, Flow, Gauge)', () => {
        expect(component.visualMode()).toBe('donut');
        expect(fixture.nativeElement.querySelector('app-donut-chart')).toBeTruthy();

        component.setVisualMode('flow');
        fixture.detectChanges();
        expect(component.visualMode()).toBe('flow');
        expect(fixture.nativeElement.querySelector('app-flow-chart')).toBeTruthy();

        component.setVisualMode('gauge');
        fixture.detectChanges();
        expect(component.visualMode()).toBe('gauge');
        expect(fixture.nativeElement.querySelector('app-gauge-chart')).toBeTruthy();
    });

    it('should filter accounts by search query and active tab', () => {
        accounts.set([
            account('acc-1', 5000, 'City Bank Checking'),
            account('acc-2', 0, 'Empty Wallet'),
        ]);
        fixture.detectChanges();

        component.searchQuery.set('checking');
        expect(component.filteredCards().length).toBe(1);
        expect(component.filteredCards()[0].account.name).toBe('City Bank Checking');

        component.searchQuery.set('');
        component.setFilterTab('active');
        expect(component.filteredCards().length).toBe(1);
        expect(component.filteredCards()[0].account.id).toBe('acc-1');
    });
});
