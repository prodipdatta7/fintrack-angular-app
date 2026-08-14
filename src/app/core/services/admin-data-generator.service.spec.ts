import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminDataGeneratorService } from './admin-data-generator.service';
import { AccountService } from './account.service';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';
import { PlanService } from './plan.service';
import { ToastService } from './toast.service';
import { CategoryType } from '../models/category.model';

describe('AdminDataGeneratorService', () => {
    let service: AdminDataGeneratorService;
    let accountServiceSpy: jasmine.SpyObj<AccountService>;
    let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
    let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
    let planServiceSpy: jasmine.SpyObj<PlanService>;
    let toastServiceSpy: jasmine.SpyObj<ToastService>;

    beforeEach(() => {
        accountServiceSpy = jasmine.createSpyObj<AccountService>('AccountService', [
            'createAccount',
            'getAccounts',
        ]);
        categoryServiceSpy = jasmine.createSpyObj<CategoryService>('CategoryService', [
            'createCategory',
            'getCategories',
        ]);
        transactionServiceSpy = jasmine.createSpyObj<TransactionService>('TransactionService', [
            'createTransaction',
            'getTransactions',
        ]);
        planServiceSpy = jasmine.createSpyObj<PlanService>('PlanService', [
            'createPlan',
            'getPlans',
        ]);
        toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['show', 'error']);

        accountServiceSpy.createAccount.and.callFake((req) => of(`acc-${req.name.toLowerCase()}`));
        accountServiceSpy.getAccounts.and.returnValue(of({ items: [], totalBalance: 0 }));

        categoryServiceSpy.createCategory.and.callFake((req) => of(`cat-${req.name.toLowerCase()}`));
        categoryServiceSpy.getCategories.and.returnValue(of([]));

        transactionServiceSpy.createTransaction.and.returnValue(of('tx-123'));
        transactionServiceSpy.getTransactions.and.returnValue(
            of({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false }),
        );

        planServiceSpy.createPlan.and.returnValue(of('plan-123'));
        planServiceSpy.getPlans.and.returnValue(of([]));

        TestBed.configureTestingModule({
            providers: [
                AdminDataGeneratorService,
                { provide: AccountService, useValue: accountServiceSpy },
                { provide: CategoryService, useValue: categoryServiceSpy },
                { provide: TransactionService, useValue: transactionServiceSpy },
                { provide: PlanService, useValue: planServiceSpy },
                { provide: ToastService, useValue: toastServiceSpy },
            ],
        });

        service = TestBed.inject(AdminDataGeneratorService);

        const mockAccounts = service.defaultAccounts.map((a) => ({
            id: `acc-${a.name.toLowerCase()}`,
            name: a.name,
            accountType: a.accountType,
            balance: a.balance,
            provider: a.provider,
            color: a.color,
            icon: a.icon,
            currency: 'BDT',
            isClosed: false,
            createdAt: new Date().toISOString(),
        }));
        accountServiceSpy.getAccounts.and.returnValue(of({ items: mockAccounts, totalBalance: 100000 }));

        const mockCategories = service.defaultCategories.map((c) => ({
            id: `cat-${c.name.toLowerCase()}`,
            name: c.name,
            type: c.type,
            icon: c.icon,
            color: c.color,
            budgetLimit: c.budgetLimit,
        }));
        categoryServiceSpy.getCategories.and.returnValue(of(mockCategories as any));
    });

    it('should initialize with default states and templates', () => {
        expect(service.isGenerating()).toBeFalse();
        expect(service.progressPercentage()).toBe(0);
        expect(service.logs().length).toBe(0);
        expect(service.defaultAccounts.length).toBe(4);
        expect(service.defaultCategories.length).toBe(11);
        expect(service.defaultPlans.length).toBe(3);
    });

    it('should execute seedAll() creating accounts, categories, transactions, and plans', async () => {
        await service.seedAll();

        expect(accountServiceSpy.createAccount).toHaveBeenCalledTimes(4);
        expect(categoryServiceSpy.createCategory).toHaveBeenCalledTimes(11);
        expect(transactionServiceSpy.createTransaction).toHaveBeenCalled();
        expect(planServiceSpy.createPlan).toHaveBeenCalledTimes(3);

        expect(accountServiceSpy.getAccounts).toHaveBeenCalled();
        expect(categoryServiceSpy.getCategories).toHaveBeenCalled();
        expect(transactionServiceSpy.getTransactions).toHaveBeenCalled();
        expect(planServiceSpy.getPlans).toHaveBeenCalled();

        expect(service.progressPercentage()).toBe(100);
        expect(service.isGenerating()).toBeFalse();
        expect(service.logs().length).toBeGreaterThan(5);
        expect(toastServiceSpy.show).toHaveBeenCalled();
    });

    it('should execute seedAccountsOnly()', async () => {
        await service.seedAccountsOnly();

        expect(accountServiceSpy.createAccount).toHaveBeenCalledTimes(4);
        expect(accountServiceSpy.getAccounts).toHaveBeenCalled();
        expect(service.progressPercentage()).toBe(100);
        expect(toastServiceSpy.show).toHaveBeenCalled();
    });

    it('should execute seedCategoriesOnly()', async () => {
        await service.seedCategoriesOnly();

        expect(categoryServiceSpy.createCategory).toHaveBeenCalledTimes(11);
        expect(categoryServiceSpy.getCategories).toHaveBeenCalled();
        expect(service.progressPercentage()).toBe(100);
        expect(toastServiceSpy.show).toHaveBeenCalled();
    });

    it('should execute seedPlansOnly()', async () => {
        await service.seedPlansOnly();

        expect(planServiceSpy.createPlan).toHaveBeenCalledTimes(3);
        expect(planServiceSpy.getPlans).toHaveBeenCalled();
        expect(service.progressPercentage()).toBe(100);
        expect(toastServiceSpy.show).toHaveBeenCalled();
    });

    it('should handle errors gracefully during seedAll() and log them', async () => {
        accountServiceSpy.createAccount.and.returnValue(throwError(() => new Error('API down')));

        await service.seedAll();

        expect(service.isGenerating()).toBeFalse();
        expect(toastServiceSpy.error).toHaveBeenCalledWith('Seeding failed: API down');
        expect(service.logs().some((l) => l.includes('ERROR: API down'))).toBeTrue();
    });

    it('should seed transactions with a strictly uniform distribution across all categories', async () => {
        const recordedCategoryIds: string[] = [];
        transactionServiceSpy.createTransaction.and.callFake((req) => {
            recordedCategoryIds.push(req.categoryId);
            return of('tx-id');
        });

        await service.seedAll();

        // 11 categories * 4 transactions each = 44 transactions
        expect(recordedCategoryIds.length).toBe(44);

        // Every category ID should be called exactly 4 times
        const countMap = new Map<string, number>();
        for (const catId of recordedCategoryIds) {
            countMap.set(catId, (countMap.get(catId) || 0) + 1);
        }

        expect(countMap.size).toBe(11);
        for (const [_, count] of countMap) {
            expect(count).toBe(4);
        }
    });
});
