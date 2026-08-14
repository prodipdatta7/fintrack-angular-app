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

        accountServiceSpy.createAccount.and.returnValue(of('acc-123'));
        accountServiceSpy.getAccounts.and.returnValue(of({ items: [], totalBalance: 0 }));

        categoryServiceSpy.createCategory.and.returnValue(of('cat-123'));
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

    it('should clear logs when clearLogs() is invoked', () => {
        service.logs.set(['Log 1', 'Log 2']);
        service.clearLogs();
        expect(service.logs()).toEqual([]);
    });
});
