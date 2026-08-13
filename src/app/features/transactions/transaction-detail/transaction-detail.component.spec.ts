import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { TransactionDetailComponent } from './transaction-detail.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { CategoryType } from '../../../core/models/category.model';
import { Transaction } from '../../../core/models/transaction.model';
import { TransactionEvent } from '../../../core/models/transaction-event.model';
import { Account } from '../../../core/models/account.model';

const mockTx: Transaction = {
    id: 'tx-100',
    title: 'TechCorp Salary Deposit',
    amount: 3500.5,
    type: CategoryType.Income,
    categoryId: 'cat-1',
    accountId: 'acc-1',
    date: '2026-07-31',
    time: '14:30',
    paymentMethod: 'Bank Transfer',
    tags: 'Salary, Work',
    note: 'Bi-weekly payroll distribution',
    timeZoneOffsetInMinutes: 0,
    userId: 'u1',
};

const mockCategory = {
    id: 'cat-1',
    name: 'Employment',
    icon: '💼',
    color: '#22c55e',
    type: CategoryType.Income,
    budgetLimit: 0,
    userId: 'u1',
};

const mockAccount: Account = {
    id: 'acc-1',
    name: 'Bank Account',
    accountType: 'Bank',
    balance: 5420,
    currency: 'USD',
    icon: '🏦',
    provider: 'City Bank / Chase',
    color: '#6366f1',
    isClosed: false,
    createdAt: '2026-01-10T00:00:00Z',
};

const mockEvents: TransactionEvent[] = [
    {
        id: 'e1',
        transactionId: 'tx-100',
        eventType: 'TransactionCreated',
        occurredOnUtc: '2026-07-31T09:00:00Z',
        summary: 'Transaction created',
        detail: 'Created manual record entry',
        performedBy: 'alex@fintrack.io',
        dataJson: '{}',
    },
];

describe('TransactionDetailComponent', () => {
    let component: TransactionDetailComponent;
    let fixture: ComponentFixture<TransactionDetailComponent>;
    let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
    let confirmSpy: jasmine.SpyObj<ConfirmDialogService>;
    let toastService: ToastService;

    beforeEach(async () => {
        transactionServiceSpy = jasmine.createSpyObj(
            'TransactionService',
            ['getTransactionById', 'getTransactionEvents', 'deleteTransaction'],
            { transactions: signal([mockTx]) },
        );
        transactionServiceSpy.getTransactionById.and.returnValue(of(mockTx));
        transactionServiceSpy.getTransactionEvents.and.returnValue(of(mockEvents));
        transactionServiceSpy.deleteTransaction.and.returnValue(of(void 0));

        const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategoryById'], {
            categories: signal([mockCategory]),
        });
        categoryServiceSpy.getCategoryById.and.returnValue(of(mockCategory));

        const accountServiceSpy = jasmine.createSpyObj('AccountService', ['getAccountById', 'getAccounts']);
        accountServiceSpy.getAccountById.and.returnValue(of(mockAccount));
        accountServiceSpy.getAccounts.and.returnValue(of({ items: [mockAccount], totalBalance: mockAccount.balance }));

        confirmSpy = jasmine.createSpyObj('ConfirmDialogService', ['confirmDelete', 'open']);
        confirmSpy.confirmDelete.and.returnValue(of(true));

        await TestBed.configureTestingModule({
            imports: [TransactionDetailComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                ToastService,
                { provide: TransactionService, useValue: transactionServiceSpy },
                { provide: CategoryService, useValue: categoryServiceSpy },
                { provide: AccountService, useValue: accountServiceSpy },
                { provide: ConfirmDialogService, useValue: confirmSpy },
                {
                    provide: ActivatedRoute,
                    useValue: { paramMap: of(convertToParamMap({ id: 'tx-100' })) },
                },
            ],
        }).compileComponents();

        toastService = TestBed.inject(ToastService);
        fixture = TestBed.createComponent(TransactionDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => toastService.clear());

    it('should load the transaction, its category and its account', () => {
        expect(component.transaction()?.id).toBe('tx-100');
        expect(component.category()?.name).toBe('Employment');
        expect(component.account()?.name).toBe('Bank Account');
    });

    it('should render the hero with a signed amount', () => {
        const host = fixture.nativeElement as HTMLElement;
        expect(host.querySelector('.hero-title')?.textContent?.trim()).toBe('TechCorp Salary Deposit');
        expect(host.querySelector('.hero-amount')?.textContent?.trim()).toMatch(/^\+.*3,500\.50$/);
        expect(host.querySelector('.hero-amount')?.textContent).not.toContain('$');
    });

    it('should render the three info cards', () => {
        const titles = Array.from(fixture.nativeElement.querySelectorAll('.info-card-title')) as HTMLElement[];
        expect(titles.slice(0, 3).map((t) => t.textContent?.trim())).toEqual([
            'Category Information',
            'Account Storage Source',
            'Record Details',
        ]);
    });

    it('should show real record data instead of a fabricated verification hash', () => {
        const details = fixture.nativeElement.querySelector('.record-details') as HTMLElement;
        expect(details.textContent).toContain('tx-100');
        expect(details.textContent).not.toContain('0x8f3a');
    });

    it('should render the note memorandum only when a note exists', () => {
        expect(fixture.nativeElement.querySelector('.note-body').textContent).toContain(
            'Bi-weekly payroll distribution',
        );

        transactionServiceSpy.getTransactionById.and.returnValue(of({ ...mockTx, note: undefined }));
        const second = TestBed.createComponent(TransactionDetailComponent);
        second.detectChanges();
        expect(second.nativeElement.querySelector('.note-body')).toBeNull();
    });

    it('should render the audit timeline inline with its event count', () => {
        expect(transactionServiceSpy.getTransactionEvents).toHaveBeenCalledWith('tx-100');
        expect(fixture.nativeElement.querySelector('app-audit-timeline')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.audit-count').textContent.trim()).toBe('1 Recorded Events');
        expect(fixture.nativeElement.querySelector('.timeline-operator').textContent).toContain('alex@fintrack.io');
    });

    it('should keep the tags list', () => {
        expect(component.tagsList).toEqual(['Salary', 'Work']);
        expect(fixture.nativeElement.querySelectorAll('.tags-list .chip').length).toBe(2);
    });

    it('should delete behind the confirm dialog and navigate back to the list', () => {
        const router = TestBed.inject(Router);
        const navigateSpy = spyOn(router, 'navigate');

        component.deleteTransaction();

        expect(confirmSpy.confirmDelete).toHaveBeenCalled();
        expect(transactionServiceSpy.deleteTransaction).toHaveBeenCalledWith('tx-100');
        expect(toastService.toasts()[0].message).toBe('Transaction removed');
        expect(navigateSpy).toHaveBeenCalledWith(['/transactions']);
    });

    it('should not delete when the dialog is dismissed', () => {
        confirmSpy.confirmDelete.and.returnValue(of(false));
        component.deleteTransaction();
        expect(transactionServiceSpy.deleteTransaction).not.toHaveBeenCalled();
    });

    it('should format a 24h time into a 12h clock', () => {
        expect(component.formatTime('14:30')).toBe('2:30 PM');
        expect(component.formatTime('00:05')).toBe('12:05 AM');
        expect(component.formatTime(undefined)).toBe('Not specified');
    });
});
