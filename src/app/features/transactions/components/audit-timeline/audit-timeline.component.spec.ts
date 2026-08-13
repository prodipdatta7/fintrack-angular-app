import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditTimelineComponent } from './audit-timeline.component';
import { TransactionEvent } from '../../../../core/models/transaction-event.model';

const event = (id: string, eventType: string, overrides: Partial<TransactionEvent> = {}): TransactionEvent => ({
    id,
    transactionId: 'tx-1',
    eventType,
    occurredOnUtc: '2026-08-01T09:00:00Z',
    summary: 'Transaction created: Rent ($1,550.00)',
    detail: 'Initial recurring ledger creation',
    performedBy: 'alex@fintrack.io',
    dataJson: '{}',
    ...overrides,
});

describe('AuditTimelineComponent', () => {
    let fixture: ComponentFixture<AuditTimelineComponent>;
    let component: AuditTimelineComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [AuditTimelineComponent] }).compileComponents();
        fixture = TestBed.createComponent(AuditTimelineComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('events', [
            event('e1', 'TransactionCreated'),
            event('e2', 'TransactionUpdated', { detail: 'Amount $120.00 → $145.50' }),
        ]);
        fixture.detectChanges();
    });

    it('should render one node per event in order', () => {
        const items = Array.from(fixture.nativeElement.querySelectorAll('.timeline-item')) as HTMLElement[];
        expect(items.length).toBe(2);
        expect(items[0].querySelector('.timeline-type')?.textContent).toContain('TransactionCreated');
        expect(items[1].querySelector('.timeline-detail')?.textContent?.trim()).toBe('Amount $120.00 → $145.50');
    });

    it('should show the operator behind each event', () => {
        expect(fixture.nativeElement.querySelector('.timeline-operator').textContent.trim()).toBe(
            'Operator: alex@fintrack.io',
        );
    });

    it('should fall back to System for legacy events without an operator', () => {
        expect(component.operator(event('e3', 'TransactionCreated', { performedBy: '' }))).toBe('System');
    });

    it('should fall back to the summary when no detail was recorded', () => {
        expect(component.describe(event('e4', 'TransactionCreated', { detail: '' }))).toBe(
            'Transaction created: Rent ($1,550.00)',
        );
    });

    it('should colour nodes by event kind', () => {
        expect(component.nodeClass('TransactionCreated')).toBe('created');
        expect(component.nodeClass('TransactionUpdated')).toBe('updated');
        expect(component.nodeClass('TransactionDeleted')).toBe('deleted');
    });

    it('should show an empty message with no events', () => {
        fixture.componentRef.setInput('events', []);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.timeline-empty')).toBeTruthy();
    });

    it('should show skeletons while loading', () => {
        fixture.componentRef.setInput('isLoading', true);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('.timeline-skeleton').length).toBe(3);
    });
});
