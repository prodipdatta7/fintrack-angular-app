import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AccountService } from './account.service';
import { Account } from '../models/account.model';

const account = (id: string, balance: number): Account => ({
    id,
    name: `Account ${id}`,
    accountType: 'Bank',
    balance,
    currency: 'USD',
    icon: '🏦',
    provider: 'City Bank',
    color: '#6366f1',
    isClosed: false,
    createdAt: '2026-01-10T00:00:00Z',
});

describe('AccountService', () => {
    let service: AccountService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [AccountService, provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(AccountService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    const loadAccounts = (accounts: Account[]) => {
        service.getAccounts().subscribe();
        httpMock.expectOne('/api/get-accounts').flush({ items: accounts, totalBalance: 0 });
    };

    it('should fetch accounts and populate the signal', () => {
        loadAccounts([account('acc-1', 5420), account('acc-2', 1450)]);
        expect(service.accounts().length).toBe(2);
        expect(service.isLoading()).toBeFalse();
    });

    it('should compute the total balance from the loaded accounts', () => {
        loadAccounts([account('acc-1', 5420), account('acc-2', 1450), account('acc-3', 820)]);
        expect(service.totalBalance()).toBe(7690);
    });

    it('should exclude closed accounts from the total balance', () => {
        loadAccounts([account('acc-1', 5420), { ...account('acc-2', 1450), isClosed: true }]);
        expect(service.totalBalance()).toBe(5420);
    });

    it('should request closed accounts only when asked', () => {
        service.getAccounts(true).subscribe();
        httpMock.expectOne('/api/get-accounts?includeClosed=true').flush({ items: [], totalBalance: 0 });
    });

    it('should patch the balance in place so totals refresh without a refetch', () => {
        loadAccounts([account('acc-1', 5420), account('acc-2', 1450)]);

        service.updateBalance('acc-1', 6000).subscribe();
        const req = httpMock.expectOne('/api/update-account-balance/acc-1');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ balance: 6000 });
        req.flush(null);

        expect(service.accounts().find((a) => a.id === 'acc-1')?.balance).toBe(6000);
        expect(service.totalBalance()).toBe(7450);
    });

    it('should not patch the signal when the balance request fails', () => {
        loadAccounts([account('acc-1', 5420)]);

        service.updateBalance('acc-1', 9999).subscribe({ error: () => undefined });
        httpMock
            .expectOne('/api/update-account-balance/acc-1')
            .flush('nope', { status: 500, statusText: 'Server Error' });

        expect(service.accounts()[0].balance).toBe(5420);
    });

    it('should compute portfolio share and guard a zero total', () => {
        loadAccounts([account('acc-1', 7500), account('acc-2', 2500)]);
        expect(service.portfolioShare('acc-1')).toBe(75);
        expect(service.portfolioShare('acc-2')).toBe(25);
        expect(service.portfolioShare('missing')).toBe(0);

        service.accounts.set([account('acc-1', 0)]);
        expect(service.portfolioShare('acc-1')).toBe(0);
    });

    it('should fetch a single account', () => {
        service.getAccountById('acc-1').subscribe((res) => expect(res.id).toBe('acc-1'));
        const req = httpMock.expectOne('/api/get-account/acc-1');
        expect(req.request.method).toBe('GET');
        req.flush(account('acc-1', 100));
    });

    it('should create and update accounts', () => {
        const payload = {
            name: 'Nagad Wallet',
            accountType: 'MFS' as const,
            balance: 820,
            currency: 'USD',
            icon: '📲',
            provider: 'Nagad Digital',
            color: '#f97316',
        };

        service.createAccount(payload).subscribe((id) => expect(id).toBe('acc-9'));
        const createReq = httpMock.expectOne('/api/create-account');
        expect(createReq.request.method).toBe('POST');
        createReq.flush({ accountId: 'acc-9' });

        const { balance: _balance, ...updatePayload } = payload;
        service.updateAccount({ ...updatePayload, id: 'acc-9' }).subscribe();
        const updateReq = httpMock.expectOne('/api/update-account/acc-9');
        expect(updateReq.request.method).toBe('PUT');
        expect(updateReq.request.body.balance).toBeUndefined();
        updateReq.flush(null);
    });

    it('should patch isClosed in the signal when closing an account', () => {
        loadAccounts([account('acc-1', 100), account('acc-2', 200)]);

        service.setAccountStatus('acc-1', true).subscribe();
        const req = httpMock.expectOne('/api/update-account-status/acc-1');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ isClosed: true });
        req.flush(null);

        expect(service.accounts().map((a) => a.id)).toEqual(['acc-1', 'acc-2']);
        expect(service.accounts().find((a) => a.id === 'acc-1')?.isClosed).toBeTrue();
        expect(service.totalBalance()).toBe(200);
    });

    it('should report zero portfolio share for closed accounts', () => {
        loadAccounts([account('acc-1', 7500), { ...account('acc-2', 2500), isClosed: true }]);
        expect(service.portfolioShare('acc-1')).toBe(100);
        expect(service.portfolioShare('acc-2')).toBe(0);
    });
});
