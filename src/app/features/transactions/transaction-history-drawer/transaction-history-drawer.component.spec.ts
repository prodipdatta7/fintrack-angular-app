import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionHistoryDrawerComponent } from './transaction-history-drawer.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { of } from 'rxjs';
import { SimpleChange } from '@angular/core';

describe('TransactionHistoryDrawerComponent', () => {
    let component: TransactionHistoryDrawerComponent;
    let fixture: ComponentFixture<TransactionHistoryDrawerComponent>;
    let transactionServiceSpy: jasmine.SpyObj<TransactionService>;

    beforeEach(async () => {
        transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getTransactionEvents']);

        await TestBed.configureTestingModule({
            imports: [TransactionHistoryDrawerComponent],
            providers: [{ provide: TransactionService, useValue: transactionServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(TransactionHistoryDrawerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create drawer component', () => {
        expect(component).toBeTruthy();
    });

    it('should load event sourcing stream when transactionId changes and drawer is visible', () => {
        const dummyEvents = [
            {
                id: 'e-1',
                transactionId: 'tx-123',
                eventType: 'TransactionCreated',
                occurredOnUtc: '2026-07-31T10:00:00Z',
                summary: 'Transaction created',
                detail: 'Created manual record entry',
                performedBy: 'alex@fintrack.io',
                dataJson: '{}',
            },
        ];
        transactionServiceSpy.getTransactionEvents.and.returnValue(of(dummyEvents));

        component.visible = true;
        component.transactionId = 'tx-123';
        component.ngOnChanges({
            transactionId: new SimpleChange(null, 'tx-123', true),
        });

        expect(transactionServiceSpy.getTransactionEvents).toHaveBeenCalledWith('tx-123');
        expect(component.events.length).toBe(1);
        expect(component.events[0].eventType).toBe('TransactionCreated');
    });
});
