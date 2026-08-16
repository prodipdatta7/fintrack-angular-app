import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminDataGeneratorService } from '../../../core/services/admin-data-generator.service';
import { AuthService } from '../../../core/services/auth.service';
import { AccountService } from '../../../core/services/account.service';
import { CategoryService } from '../../../core/services/category.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { PlanService } from '../../../core/services/plan.service';

describe('AdminDashboardComponent', () => {
    let component: AdminDashboardComponent;
    let fixture: ComponentFixture<AdminDashboardComponent>;
    let generatorSpy: jasmine.SpyObj<AdminDataGeneratorService>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let accountServiceSpy: jasmine.SpyObj<AccountService>;
    let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
    let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
    let planServiceSpy: jasmine.SpyObj<PlanService>;

    const mockIsGenerating = signal<boolean>(false);
    const mockProgressPercentage = signal<number>(0);
    const mockCurrentStep = signal<string>('');
    const mockLogs = signal<string[]>([]);

    beforeEach(async () => {
        mockIsGenerating.set(false);
        mockProgressPercentage.set(0);
        mockCurrentStep.set('');
        mockLogs.set([]);

        generatorSpy = jasmine.createSpyObj<AdminDataGeneratorService>('AdminDataGeneratorService', [
            'seedAll',
            'seedAccountsOnly',
            'seedCategoriesOnly',
            'seedTransactionsOnly',
            'seedPlansOnly',
            'clearLogs',
        ]);
        Object.defineProperty(generatorSpy, 'isGenerating', { value: mockIsGenerating });
        Object.defineProperty(generatorSpy, 'progressPercentage', { value: mockProgressPercentage });
        Object.defineProperty(generatorSpy, 'currentStep', { value: mockCurrentStep });
        Object.defineProperty(generatorSpy, 'logs', { value: mockLogs });

        generatorSpy.seedAll.and.resolveTo();
        generatorSpy.seedAccountsOnly.and.resolveTo();
        generatorSpy.seedCategoriesOnly.and.resolveTo();
        generatorSpy.seedTransactionsOnly.and.resolveTo();
        generatorSpy.seedPlansOnly.and.resolveTo();

        authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [], {
            currentUser: signal({ id: 'u-1', email: 'admin@fintrack.app' }),
            isAdmin: signal(true),
        });

        accountServiceSpy = jasmine.createSpyObj<AccountService>('AccountService', ['getAccounts'], {
            accounts: signal([{ id: 'acc-1', name: 'Checking', isClosed: false } as never]),
        });
        accountServiceSpy.getAccounts.and.returnValue(of({ items: [], totalBalance: 0 }));

        categoryServiceSpy = jasmine.createSpyObj<CategoryService>('CategoryService', ['getCategories'], {
            categories: signal([{ id: 'cat-1', name: 'Salary' } as never]),
        });
        categoryServiceSpy.getCategories.and.returnValue(of([]));

        transactionServiceSpy = jasmine.createSpyObj<TransactionService>('TransactionService', ['refreshTotalCount'], {
            totalCount: signal(42),
        });
        transactionServiceSpy.refreshTotalCount.and.returnValue(of(42));

        planServiceSpy = jasmine.createSpyObj<PlanService>('PlanService', ['getPlans'], {
            plans: signal([{ id: 'plan-1', title: 'Vacation' } as never]),
        });
        planServiceSpy.getPlans.and.returnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [AdminDashboardComponent],
            providers: [
                provideRouter([]),
                { provide: AdminDataGeneratorService, useValue: generatorSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: AccountService, useValue: accountServiceSpy },
                { provide: CategoryService, useValue: categoryServiceSpy },
                { provide: TransactionService, useValue: transactionServiceSpy },
                { provide: PlanService, useValue: planServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and render metric counts and admin email', () => {
        expect(component).toBeTruthy();
        expect(component.adminEmail()).toBe('admin@fintrack.app');
        expect(component.accountCount()).toBe(1);
        expect(component.categoryCount()).toBe(1);
        expect(component.transactionCount()).toBe(42);
        expect(component.planCount()).toBe(1);
    });

    it('should call generator.seedAll when seedAll button is clicked', () => {
        component.seedAll();
        expect(generatorSpy.seedAll).toHaveBeenCalled();
    });

    it('should call generator methods for modular seeding', () => {
        component.seedAccounts();
        expect(generatorSpy.seedAccountsOnly).toHaveBeenCalled();

        component.seedCategories();
        expect(generatorSpy.seedCategoriesOnly).toHaveBeenCalled();

        component.seedTransactions();
        expect(generatorSpy.seedTransactionsOnly).toHaveBeenCalled();

        component.seedPlans();
        expect(generatorSpy.seedPlansOnly).toHaveBeenCalled();
    });

    it('should call clearLogs and refreshStats', () => {
        component.clearLogs();
        expect(generatorSpy.clearLogs).toHaveBeenCalled();

        component.refreshStats();
        expect(accountServiceSpy.getAccounts).toHaveBeenCalled();
        expect(categoryServiceSpy.getCategories).toHaveBeenCalled();
        expect(transactionServiceSpy.refreshTotalCount).toHaveBeenCalled();
        expect(planServiceSpy.getPlans).toHaveBeenCalled();
    });
});
