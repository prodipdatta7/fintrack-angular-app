import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';
import { TransactionPagedResult } from '../models/transaction.model';
import { TransactionEvent } from '../models/transaction-event.model';
import { CategoryType } from '../models/category.model';

describe('TransactionService', () => {
    let service: TransactionService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TransactionService, provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(TransactionService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should fetch transactions and update signals', () => {
        const dummyPaged: TransactionPagedResult = {
            items: [
                {
                    id: 'tx-1',
                    title: 'Grocery Order',
                    amount: 85.5,
                    type: CategoryType.Expense,
                    categoryId: 'cat-1',
                    accountId: 'acc-1',
                    date: '2026-07-31T00:00:00Z',
                    timeZoneOffsetInMinutes: 0,
                    userId: 'user-1',
                },
            ],
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
        };

        service.getTransactions().subscribe((res) => {
            expect(res.items.length).toBe(1);
            expect(service.transactions().length).toBe(1);
        });

        const req = httpMock.expectOne((request) => request.url === '/api/get-transactions');
        expect(req.request.method).toBe('GET');
        req.flush(dummyPaged);
    });

    it('should send the advanced filter params when provided', () => {
        service
            .getTransactions(2, 25, 'cat-3', CategoryType.Expense, 'apple', {
                accountId: 'acc-1',
                fromDate: '2026-08-01',
                toDate: '2026-08-31',
                minAmount: 10,
                maxAmount: 900,
                sortBy: 'amount-desc',
            })
            .subscribe();

        const req = httpMock.expectOne((request) => request.url === '/api/get-transactions');
        const params = req.request.params;
        expect(params.get('page')).toBe('2');
        expect(params.get('pageSize')).toBe('25');
        expect(params.get('categoryId')).toBe('cat-3');
        expect(params.get('searchTerm')).toBe('apple');
        expect(params.get('accountId')).toBe('acc-1');
        expect(params.get('fromDate')).toBe('2026-08-01');
        expect(params.get('toDate')).toBe('2026-08-31');
        expect(params.get('minAmount')).toBe('10');
        expect(params.get('maxAmount')).toBe('900');
        expect(params.get('sortBy')).toBe('amount-desc');

        req.flush({
            items: [],
            totalCount: 0,
            page: 2,
            pageSize: 25,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: true,
        });
    });

    it('should omit advanced filter params that are not set', () => {
        service.getTransactions(1, 10).subscribe();

        const req = httpMock.expectOne((request) => request.url === '/api/get-transactions');
        const params = req.request.params;
        expect(params.has('accountId')).toBeFalse();
        expect(params.has('minAmount')).toBeFalse();
        expect(params.has('maxAmount')).toBeFalse();
        expect(params.has('sortBy')).toBeFalse();

        req.flush({
            items: [],
            totalCount: 0,
            page: 1,
            pageSize: 10,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
        });
    });

    it('should fetch transaction event history stream for event sourcing', () => {
        const dummyEvents: TransactionEvent[] = [
            {
                id: 'evt-1',
                transactionId: 'tx-1',
                eventType: 'TransactionCreated',
                occurredOnUtc: '2026-07-31T12:00:00Z',
                summary: 'Transaction created: Grocery Order ($85.50)',
                detail: 'Created manual record entry',
                performedBy: 'alex@fintrack.io',
                dataJson: '{}',
            },
        ];

        service.getTransactionEvents('tx-1').subscribe((events) => {
            expect(events.length).toBe(1);
            expect(events[0].eventType).toBe('TransactionCreated');
        });

        const req = httpMock.expectOne('/api/get-transaction-events/tx-1');
        expect(req.request.method).toBe('GET');
        req.flush(dummyEvents);
    });
});
