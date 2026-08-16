import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { DashboardSummary } from '../models/dashboard.model';

const SUMMARY_URL = '/api/get-dashboard-summary';
const CASHFLOW_URL = '/api/get-cashflow';

const summary: DashboardSummary = {
    totalIncome: 6200,
    totalExpense: 2468.7,
    netSavings: 3731.3,
    categorySpent: [{ categoryId: 'cat-1', spent: 1550 }],
    recentTransactions: [],
    transactionCount: 6,
};

describe('DashboardService', () => {
    let service: DashboardService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [DashboardService, provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(DashboardService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('should fetch the summary and populate the signal', () => {
        service.getSummary().subscribe();
        const req = httpMock.expectOne((r) => r.url === SUMMARY_URL);
        expect(req.request.method).toBe('GET');
        expect(req.request.params.keys().length).toBe(0);
        req.flush(summary);

        expect(service.summary()?.netSavings).toBe(3731.3);
        expect(service.isLoadingSummary()).toBeFalse();
    });

    it('should send only the summary params that are set', () => {
        service.getSummary({ accountId: 'acc-1', from: '', to: undefined, timeframe: '7D' }).subscribe();
        const req = httpMock.expectOne((r) => r.url === SUMMARY_URL);
        expect(req.request.params.get('accountId')).toBe('acc-1');
        expect(req.request.params.get('timeframe')).toBe('7D');
        expect(req.request.params.has('from')).toBeFalse();
        expect(req.request.params.has('to')).toBeFalse();
        req.flush(summary);
    });

    it('should always send the timeframe on a cashflow request', () => {
        service.getCashflow('6M').subscribe();
        const req = httpMock.expectOne((r) => r.url === CASHFLOW_URL);
        expect(req.request.params.get('timeframe')).toBe('6M');
        req.flush([{ label: 'Aug', income: 6200, expense: 2468 }]);

        expect(service.cashflow().length).toBe(1);
        expect(service.isLoadingCashflow()).toBeFalse();
    });

    it('should map This Month to Custom with a calendar from/to range', () => {
        service.getCashflow('This Month').subscribe();
        const req = httpMock.expectOne((r) => r.url === CASHFLOW_URL);
        expect(req.request.params.get('timeframe')).toBe('Custom');
        expect(req.request.params.get('from')).toBeTruthy();
        expect(req.request.params.get('to')).toBeTruthy();
        req.flush([]);
    });

    it('should map This Year to Custom and keep an account filter', () => {
        service.getCashflow('This Year', { accountId: 'acc-9' }).subscribe();
        const req = httpMock.expectOne((r) => r.url === CASHFLOW_URL);
        expect(req.request.params.get('timeframe')).toBe('Custom');
        expect(req.request.params.get('accountId')).toBe('acc-9');
        expect(req.request.params.get('from')).toBeTruthy();
        expect(req.request.params.get('to')).toBeTruthy();
        req.flush([]);
    });

    it('should map All to the 1Y cashflow preset', () => {
        service.getCashflow('All').subscribe();
        const req = httpMock.expectOne((r) => r.url === CASHFLOW_URL);
        expect(req.request.params.get('timeframe')).toBe('1Y');
        expect(req.request.params.has('from')).toBeFalse();
        req.flush([]);
    });

    it('should pass a custom range and an account filter to the cashflow endpoint', () => {
        service.getCashflow('Custom', { from: '2026-07-01', to: '2026-08-10', accountId: 'acc-2' }).subscribe();
        const req = httpMock.expectOne((r) => r.url === CASHFLOW_URL);
        expect(req.request.params.get('timeframe')).toBe('Custom');
        expect(req.request.params.get('from')).toBe('2026-07-01');
        expect(req.request.params.get('to')).toBe('2026-08-10');
        expect(req.request.params.get('accountId')).toBe('acc-2');
        req.flush([]);
    });

    it('should keep an empty series when the API returns no buckets', () => {
        service.getCashflow('7D').subscribe();
        httpMock.expectOne((r) => r.url === CASHFLOW_URL).flush([]);
        expect(service.cashflow()).toEqual([]);
    });
});
