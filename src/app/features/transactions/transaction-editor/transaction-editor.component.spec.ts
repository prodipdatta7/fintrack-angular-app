import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { TransactionEditorComponent } from './transaction-editor.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { AccountService } from '../../../core/services/account.service';
import { TagService } from '../../../core/services/tag.service';
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
                {
                    id: 'cat-salary',
                    name: 'Salary',
                    icon: 'cash',
                    color: '#2ecc71',
                    type: CategoryType.Income,
                    budgetLimit: 0,
                    userId: 'u-1',
                },
                {
                    id: 'cat-invest',
                    name: 'Investments',
                    icon: 'trending-up',
                    color: '#27ae60',
                    type: CategoryType.Income,
                    budgetLimit: 0,
                    userId: 'u-1',
                },
            ]),
        });
        categoryServiceSpy.getCategories.and.returnValue(of([]));

        const accountServiceSpy = jasmine.createSpyObj('AccountService', ['getAccounts'], {
            accounts: signal([account('acc-1', 'Bank Account'), account('acc-2', 'bKash Wallet')]),
        });
        accountServiceSpy.getAccounts.and.returnValue(of({ items: [], totalBalance: 0 }));

        const tagServiceSpy = jasmine.createSpyObj('TagService', ['loadTags', 'createTag'], {
            tags: signal([]),
            categoryTags: signal({}),
            isLoading: signal(false),
        });
        tagServiceSpy.loadTags.and.returnValue(of([]));
        tagServiceSpy.createTag.and.returnValue(of('Vacation2026'));

        await TestBed.configureTestingModule({
            imports: [TransactionEditorComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                ToastService,
                { provide: TransactionService, useValue: transactionServiceSpy },
                { provide: CategoryService, useValue: categoryServiceSpy },
                { provide: AccountService, useValue: accountServiceSpy },
                { provide: TagService, useValue: tagServiceSpy },
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

    it('should start on the basics step for create mode', () => {
        expect(component).toBeTruthy();
        expect(component.activeStep()).toBe('basics');
        expect(component.intent()).toBeNull();
    });

    it('should select expense intent and stay on basics for amount entry', () => {
        component.selectIntent('expense');
        expect(component.intent()).toBe('expense');
        expect(component.activeStep()).toBe('basics');
        expect(component.form.get('type')?.value).toBe(CategoryType.Expense);
    });

    it('should perform math calculation and update amount form control', () => {
        component.selectIntent('expense');
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
        expect(controls).toContain('sourceAccountId');
        expect(controls).toContain('targetAccountId');
    });

    it('should default the account source to the first available account after intent', () => {
        component.selectIntent('expense');
        expect(component.form.get('accountId')?.value).toBe('');
        component.onPaymentMethodChange('Bank Transfer');
        expect(component.form.get('accountId')?.value).toBe('acc-1');
    });

    it('should prefill the account source from the query string', async () => {
        TestBed.resetTestingModule();
        await setup({ accountId: 'acc-2' });
        component.selectIntent('expense');
        component.onPaymentMethodChange('Debit Card');
        expect(component.form.get('accountId')?.value).toBe('acc-2');
    });

    it('should ignore an unknown account in the query string', async () => {
        TestBed.resetTestingModule();
        await setup({ accountId: 'acc-does-not-exist' });
        component.selectIntent('expense');
        component.onPaymentMethodChange('Bank Transfer');
        expect(component.form.get('accountId')?.value).toBe('acc-1');
    });

    it('should submit an expense with the chosen account and note', () => {
        component.selectIntent('expense');
        component.onPaymentMethodChange('Bank Transfer');
        component.form.patchValue({
            title: 'Whole Foods Market',
            amount: 184.5,
            categoryId: 'cat-1',
            accountId: 'acc-2',
            note: 'Weekly organic groceries',
        });
        component.activeStep.set('details');

        component.submit();

        const payload = transactionServiceSpy.createTransaction.calls.mostRecent().args[0];
        expect(payload.accountId).toBe('acc-2');
        expect(payload.note).toBe('Weekly organic groceries');
        expect(payload.type).toBe(CategoryType.Expense);
        expect(payload.paymentMethod).toBe('Bank Transfer');
        expect(payload.tags).toBeDefined();
        expect(toastService.toasts()[0].message).toBe('New transaction recorded');
    });

    it('should credit salary as income into the selected account', () => {
        component.selectIntent('salary');
        component.onPaymentMethodChange('Bank Transfer');
        component.form.patchValue({
            title: 'TechCorp March',
            amount: 4500,
            accountId: 'acc-1',
            categoryId: 'cat-salary',
        });
        component.activeStep.set('details');
        component.submit();

        const payload = transactionServiceSpy.createTransaction.calls.mostRecent().args[0];
        expect(payload.type).toBe(CategoryType.Income);
        expect(payload.accountId).toBe('acc-1');
        expect(payload.categoryId).toBe('cat-salary');
        expect(toastService.toasts()[0].message).toBe('Salary credited');
    });

    it('should create paired out/in transactions for an account transfer', () => {
        component.selectIntent('transfer');
        component.form.patchValue({
            amount: 200,
            externalSource: false,
            sourceAccountId: 'acc-1',
            targetAccountId: 'acc-2',
            title: '',
            note: 'Move to wallet',
        });
        component.activeStep.set('details');
        component.submit();

        expect(transactionServiceSpy.createTransaction.calls.count()).toBe(2);
        const outPayload = transactionServiceSpy.createTransaction.calls.allArgs()[0][0];
        const inPayload = transactionServiceSpy.createTransaction.calls.allArgs()[1][0];
        expect(outPayload.type).toBe(CategoryType.Expense);
        expect(outPayload.accountId).toBe('acc-1');
        expect(inPayload.type).toBe(CategoryType.Income);
        expect(inPayload.accountId).toBe('acc-2');
        expect(outPayload.tags).toContain('transfer');
        expect(toastService.toasts()[0].message).toBe('Transfer completed');
    });

    it('should create a single income when transfer source is external', () => {
        component.selectIntent('transfer');
        component.onExternalSourceChange(true);
        component.form.patchValue({
            amount: 50,
            externalSourceLabel: 'Cash from home',
            targetAccountId: 'acc-2',
        });
        component.activeStep.set('details');
        component.submit();

        expect(transactionServiceSpy.createTransaction.calls.count()).toBe(1);
        const payload = transactionServiceSpy.createTransaction.calls.mostRecent().args[0];
        expect(payload.type).toBe(CategoryType.Income);
        expect(payload.accountId).toBe('acc-2');
        expect(payload.title).toContain('Cash from home');
    });

    it('should require an account source for expenses', () => {
        component.selectIntent('expense');
        component.onPaymentMethodChange('Bank Transfer');
        component.form.patchValue({ title: 'x', amount: 5, categoryId: 'cat-1', accountId: '' });
        expect(component.detailsValid()).toBeFalse();
    });

    it('should filter paid-from accounts by payment method', () => {
        component.selectIntent('expense');
        expect(component.payableAccounts().length).toBe(0);
        component.onPaymentMethodChange('Bank Transfer');
        expect(component.payableAccounts().every((a) => a.accountType === 'Bank')).toBeTrue();
        component.onPaymentMethodChange('Cash');
        expect(component.payableAccounts().length).toBe(0);
    });
});
