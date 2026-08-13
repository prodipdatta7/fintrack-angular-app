import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { TransactionEditorComponent } from './transaction-editor.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../core/services/toast.service';
import { Account } from '../../../core/models/account.model';
import { CategoryType } from '../../../core/models/category.model';

const account = (id: string, name: string): Account => ({
    id,
    name,
    accountType: 'Bank',
    balance: 100,
    currency: 'USD',
    icon: '🏦',
    provider: 'Provider',
    color: '#6366f1',
    isClosed: false,
    createdAt: '2026-01-10T00:00:00Z',
});

describe('TransactionEditorComponent', () => {
    let component: TransactionEditorComponent;
    let fixture: ComponentFixture<TransactionEditorComponent>;
    let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
    let toastService: ToastService;

    const setup = async (queryParams: Record<string, string> = {}) => {
        transactionServiceSpy = jasmine.createSpyObj(
            'TransactionService',
            ['getTransactions', 'getTransactionById', 'createTransaction', 'updateTransaction'],
            { transactions: signal([]) },
        );
        transactionServiceSpy.getTransactions.and.returnValue(
            of({
                items: [],
                totalCount: 0,
                page: 1,
                pageSize: 10,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false,
            }),
        );
        transactionServiceSpy.getTransactionById.and.returnValue(of(null as never));
        transactionServiceSpy.createTransaction.and.returnValue(of('tx-new'));
        transactionServiceSpy.updateTransaction.and.returnValue(of(void 0));

        const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories'], {
            categories: signal([
                {
                    id: 'cat-1',
                    name: 'Groceries',
                    icon: '🍔',
                    color: '#10b981',
                    type: CategoryType.Expense,
                    budgetLimit: 850,
                    userId: 'u-1',
                },
            ]),
        });
        categoryServiceSpy.getCategories.and.returnValue(of([]));

        const accountServiceSpy = jasmine.createSpyObj('AccountService', ['getAccounts'], {
            accounts: signal([account('acc-1', 'Bank Account'), account('acc-2', 'bKash Wallet')]),
        });
        accountServiceSpy.getAccounts.and.returnValue(of({ items: [], totalBalance: 0 }));

        await TestBed.configureTestingModule({
            imports: [TransactionEditorComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                ToastService,
                { provide: TransactionService, useValue: transactionServiceSpy },
                { provide: CategoryService, useValue: categoryServiceSpy },
                { provide: AccountService, useValue: accountServiceSpy },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of(convertToParamMap({})),
                        snapshot: { queryParamMap: convertToParamMap(queryParams) },
                    },
                },
            ],
        }).compileComponents();

        toastService = TestBed.inject(ToastService);
        fixture = TestBed.createComponent(TransactionEditorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    };

    beforeEach(async () => setup());

    afterEach(() => toastService.clear());

    it('should create and initialize in calculator tab mode', () => {
        expect(component).toBeTruthy();
        expect(component.activeTab).toBe('calculator');
    });

    it('should perform math calculation and update amount form control', () => {
        component.calcAppendDigit('5');
        component.calcAppendOp('+');
        component.calcAppendDigit('5');
        component.calcEqual();

        expect(component.form.get('amount')?.value).toBe(10);
    });

    it('should keep the extra capabilities alongside the new fields', () => {
        const controls = Object.keys(component.form.controls);
        expect(controls).toContain('tags');
        expect(controls).toContain('receiptFileName');
        expect(controls).toContain('time');
        expect(controls).toContain('accountId');
        expect(controls).toContain('note');
    });

    it('should default the account source to the first available account', () => {
        expect(component.form.get('accountId')?.value).toBe('acc-1');
    });

    it('should prefill the account source from the query string', async () => {
        TestBed.resetTestingModule();
        await setup({ accountId: 'acc-2' });
        expect(component.form.get('accountId')?.value).toBe('acc-2');
    });

    it('should ignore an unknown account in the query string', async () => {
        TestBed.resetTestingModule();
        await setup({ accountId: 'acc-does-not-exist' });
        expect(component.form.get('accountId')?.value).toBe('acc-1');
    });

    it('should submit the chosen account and note instead of a placeholder id', () => {
        component.form.patchValue({
            title: 'Whole Foods Market',
            amount: 184.5,
            categoryId: 'cat-1',
            accountId: 'acc-2',
            note: 'Weekly organic groceries',
        });

        component.submit();

        const payload = transactionServiceSpy.createTransaction.calls.mostRecent().args[0];
        expect(payload.accountId).toBe('acc-2');
        expect(payload.note).toBe('Weekly organic groceries');
        expect(payload.tags).toBeDefined();
        expect(toastService.toasts()[0].message).toBe('New transaction recorded');
    });

    it('should require an account source', () => {
        component.form.patchValue({ title: 'x', amount: 5, categoryId: 'cat-1', accountId: '' });
        expect(component.form.valid).toBeFalse();
    });
});
