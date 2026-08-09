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

        const req = httpMock.expectOne((request) => request.url === 'http://localhost:5000/api/transactions');
        expect(req.request.method).toBe('GET');
        req.flush(dummyPaged);
    });

    it('should fetch transaction event history stream for event sourcing', () => {
        const dummyEvents: TransactionEvent[] = [
            {
                id: 'evt-1',
                transactionId: 'tx-1',
                eventType: 'TransactionCreated',
                occurredOnUtc: '2026-07-31T12:00:00Z',
                summary: 'Transaction created: Grocery Order ($85.50)',
                dataJson: '{}',
            },
        ];

        service.getTransactionEvents('tx-1').subscribe((events) => {
            expect(events.length).toBe(1);
            expect(events[0].eventType).toBe('TransactionCreated');
        });

        const req = httpMock.expectOne('http://localhost:5000/api/transactions/tx-1/events');
        expect(req.request.method).toBe('GET');
        req.flush(dummyEvents);
    });
});
