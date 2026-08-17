import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CategoryListComponent } from './category-list.component';
import { CategoryService } from '../../../core/services/category.service';
import { TagService } from '../../../core/services/tag.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, CategoryType } from '../../../core/models/category.model';
import { DashboardSummary } from '../../../core/models/dashboard.model';

const category = (id: string, name: string, type: CategoryType, budgetLimit = 0): Category => ({
    id,
    name,
    icon: '🏠',
    color: '#6366f1',
    type,
    budgetLimit,
    userId: 'u-1',
});

const summary = (categorySpent: { categoryId: string; spent: number }[]): DashboardSummary => ({
    totalIncome: 6200,
    totalExpense: 2450,
    netSavings: 3750,
    categorySpent,
    recentTransactions: [],
    transactionCount: 6,
});

describe('CategoryListComponent', () => {
    let fixture: ComponentFixture<CategoryListComponent>;
    let component: CategoryListComponent;
    let categories: ReturnType<typeof signal<Category[]>>;
    let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
    let dashboardServiceSpy: jasmine.SpyObj<DashboardService>;
    let toastServiceSpy: jasmine.SpyObj<ToastService>;

    beforeEach(async () => {
        categories = signal<Category[]>([
            category('cat-1', 'Housing & Rent', CategoryType.Expense, 1800),
            category('cat-2', 'Groceries & Dining', CategoryType.Expense, 850),
            category('cat-3', 'Tech & Gadgets', CategoryType.Expense, 0),
            category('cat-6', 'Salary & Income', CategoryType.Income),
        ]);

        categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories'], {
            categories,
            isLoading: signal(false),
        });
        categoryServiceSpy.getCategories.and.returnValue(of([]));

        dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getSummary'], {
            summary: signal(
                summary([
                    { categoryId: 'cat-1', spent: 1550 },
                    { categoryId: 'cat-2', spent: 900 },
                ]),
            ),
        });
        dashboardServiceSpy.getSummary.and.returnValue(of(summary([])));

        const tagServiceSpy = jasmine.createSpyObj('TagService', ['loadTags'], {
            tags: signal(['Groceries', 'Personal']),
        });
        tagServiceSpy.loadTags.and.returnValue(of(['Groceries', 'Personal']));

        toastServiceSpy = jasmine.createSpyObj('ToastService', ['show', 'error']);

        await TestBed.configureTestingModule({
            imports: [CategoryListComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                { provide: ToastService, useValue: toastServiceSpy },
                { provide: CategoryService, useValue: categoryServiceSpy },
                { provide: TagService, useValue: tagServiceSpy },
                { provide: DashboardService, useValue: dashboardServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CategoryListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should render one card per category', () => {
        expect(fixture.nativeElement.querySelectorAll('.category-card').length).toBe(4);
    });

    it('should compute spend against each category own cap', () => {
        const housingCard = component.cards().find((c) => c.category.id === 'cat-1')!;
        const groceriesCard = component.cards().find((c) => c.category.id === 'cat-2')!;
        expect(housingCard.percent).toBe(86);
        expect(groceriesCard.percent).toBe(100);
    });

    it('should flag an overspent category', () => {
        const housingCard = component.cards().find((c) => c.category.id === 'cat-1')!;
        const groceriesCard = component.cards().find((c) => c.category.id === 'cat-2')!;
        expect(housingCard.isOverBudget).toBeFalse();
        expect(groceriesCard.isOverBudget).toBeTrue();
        expect(fixture.nativeElement.querySelectorAll('.progress-fill--over').length).toBe(1);
        expect(fixture.nativeElement.textContent).toContain('Over Budget!');
    });

    it('should show No Limit and always render the progress track for expense categories', () => {
        const techCard = component.cards().find((c) => c.category.id === 'cat-3')!;
        expect(techCard.limit).toBe(0);
        expect(techCard.percent).toBe(0);
        expect(fixture.nativeElement.textContent).toContain('No Limit');
        expect(fixture.nativeElement.querySelectorAll('.category-track').length).toBe(3);
    });

    it('should render income stream block and track for income categories', () => {
        const incomeCard = component.cards().find((c) => c.category.id === 'cat-6')!;
        expect(incomeCard.showBudget).toBeFalse();
        expect(fixture.nativeElement.querySelectorAll('.category-income-section').length).toBe(1);
        expect(fixture.nativeElement.querySelectorAll('.income-track').length).toBe(1);
        expect(fixture.nativeElement.textContent).toContain('Inflow Stream');
    });

    it('should treat a category with no recorded spend as zero', () => {
        const techCard = component.cards().find((c) => c.category.id === 'cat-3')!;
        expect(techCard.spent).toBe(0);
    });

    it('should filter by search text', () => {
        component.onSearchChange('groceries');
        fixture.detectChanges();
        expect(component.cards().length).toBe(1);
        expect(fixture.nativeElement.querySelectorAll('.category-card').length).toBe(1);
    });

    it('should filter by category type scope', () => {
        component.setTypeFilter('expense');
        fixture.detectChanges();
        expect(component.cards().length).toBe(3);
        expect(component.cards().every((c) => c.category.type === CategoryType.Expense)).toBeTrue();

        component.setTypeFilter('income');
        fixture.detectChanges();
        expect(component.cards().length).toBe(1);
        expect(component.cards()[0].category.name).toBe('Salary & Income');
    });

    it('should filter by budget status', () => {
        component.budgetStatusFilter.set('capped');
        fixture.detectChanges();
        expect(component.cards().length).toBe(2); // Housing & Groceries

        component.budgetStatusFilter.set('over');
        fixture.detectChanges();
        expect(component.cards().length).toBe(1); // Groceries
        expect(component.cards()[0].category.id).toBe('cat-2');

        component.budgetStatusFilter.set('safe');
        fixture.detectChanges();
        expect(component.cards().length).toBe(1); // Housing
        expect(component.cards()[0].category.id).toBe('cat-1');

        component.budgetStatusFilter.set('uncapped');
        fixture.detectChanges();
        expect(component.cards().length).toBe(1); // Tech & Gadgets
    });

    it('should sort categories properly', () => {
        component.sortOption.set('spent-desc');
        fixture.detectChanges();
        expect(component.cards()[0].category.id).toBe('cat-1'); // 1550 spent
        expect(component.cards()[1].category.id).toBe('cat-2'); // 900 spent

        component.sortOption.set('name-desc');
        fixture.detectChanges();
        expect(component.cards()[0].category.name).toBe('Tech & Gadgets');
    });

    it('should count every non-default filter in activeFiltersCount', () => {
        expect(component.activeFiltersCount()).toBe(0);

        component.typeFilter.set('expense');
        expect(component.activeFiltersCount()).toBe(1);

        component.budgetStatusFilter.set('capped');
        expect(component.activeFiltersCount()).toBe(2);

        component.sortOption.set('spent-desc');
        expect(component.activeFiltersCount()).toBe(3);

        component.timeframe.set('30D');
        expect(component.activeFiltersCount()).toBe(4);

        component.minCap.set('100');
        expect(component.activeFiltersCount()).toBe(5);

        component.maxCap.set('2000');
        expect(component.activeFiltersCount()).toBe(6);
    });

    it('should query summary by timeframe preset', () => {
        component.onTimeframeChange('30D');
        expect(dashboardServiceSpy.getSummary).toHaveBeenCalledWith(
            jasmine.objectContaining({
                timeframe: '30D',
            }),
        );
    });

    it('should query summary by custom start and end date', () => {
        component.startDate.set('2026-08-01');
        component.endDate.set('2026-08-15');
        component.onCustomDateChange();

        expect(component.timeframe()).toBe('Custom');
        expect(dashboardServiceSpy.getSummary).toHaveBeenCalledWith(
            jasmine.objectContaining({
                timeframe: 'Custom',
                from: '2026-08-01',
                to: '2026-08-15',
            }),
        );
    });

    it('should query summary when onCustomRangeChange is emitted by app-timeframe-selector', () => {
        component.onCustomRangeChange({ from: '2026-07-01', to: '2026-07-31' });

        expect(component.timeframe()).toBe('Custom');
        expect(component.startDate()).toBe('2026-07-01');
        expect(component.endDate()).toBe('2026-07-31');
        expect(dashboardServiceSpy.getSummary).toHaveBeenCalledWith(
            jasmine.objectContaining({
                timeframe: 'Custom',
                from: '2026-07-01',
                to: '2026-07-31',
            }),
        );
    });

    it('should filter by minCap and maxCap', () => {
        component.minCap.set('800');
        component.maxCap.set('1000');
        fixture.detectChanges();

        // Groceries cap is 850, Tech is 0, Housing is 1800, Salary is 0
        expect(component.cards().length).toBe(1);
        expect(component.cards()[0].category.id).toBe('cat-2');
    });

    it('should reset all filters and reload summary data when resetAllFilters is called', () => {
        component.onSearchChange('Housing');
        component.typeFilter.set('expense');
        component.budgetStatusFilter.set('over');
        component.sortOption.set('spent-desc');
        component.timeframe.set('6M');
        component.startDate.set('2026-01-01');
        component.endDate.set('2026-06-30');
        component.minCap.set('500');
        component.maxCap.set('1500');

        expect(component.isFilterActive()).toBeTrue();
        expect(component.activeFiltersCount()).toBe(8);

        component.resetAllFilters();
        fixture.detectChanges();

        expect(component.searchText()).toBe('');
        expect(component.typeFilter()).toBe('all');
        expect(component.budgetStatusFilter()).toBe('all');
        expect(component.sortOption()).toBe('name-asc');
        expect(component.timeframe()).toBe('All');
        expect(component.startDate()).toBe('');
        expect(component.endDate()).toBe('');
        expect(component.minCap()).toBe('');
        expect(component.maxCap()).toBe('');
        expect(component.activeFiltersCount()).toBe(0);
        expect(component.isFilterActive()).toBeFalse();
        expect(dashboardServiceSpy.getSummary).toHaveBeenCalled();
    });

    it('should render filter trigger with active count and clear filters button', () => {
        expect(fixture.nativeElement.querySelector('.filter-clear')).toBeNull();

        component.typeFilter.set('expense');
        fixture.detectChanges();

        const clearBtn = fixture.nativeElement.querySelector('.filter-clear');
        expect(clearBtn).toBeTruthy();
        expect(clearBtn.textContent.trim()).toBe('Clear Filters (1)');
    });

    it('should refresh data when refresh button clicked', () => {
        component.refreshData();
        expect(categoryServiceSpy.getCategories).toHaveBeenCalled();
        expect(dashboardServiceSpy.getSummary).toHaveBeenCalled();
        expect(toastServiceSpy.show).toHaveBeenCalledWith('Categories and budget metrics refreshed');
    });

    it('should open the dialog in create mode', () => {
        component.openCreate();
        expect(component.showDialog).toBeTrue();
        expect(component.editingCategory).toBeNull();
    });

    it('should open the dialog prefilled in edit mode', () => {
        component.openEdit(categories()[0], new MouseEvent('click'));
        expect(component.showDialog).toBeTrue();
        expect(component.editingCategory?.id).toBe('cat-1');
    });

    it('should show an empty state when nothing matches', () => {
        component.onSearchChange('nothing-matches-this');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
    });

    it('should navigate to the category detail page when a card is clicked', () => {
        const router = TestBed.inject(Router);
        const navigateSpy = spyOn(router, 'navigate');
        component.openCategory(categories()[0]);
        expect(navigateSpy).toHaveBeenCalledWith(['/categories', 'cat-1']);
    });
});

