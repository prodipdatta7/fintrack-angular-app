import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CategoryListComponent } from './category-list.component';
import { CategoryService } from '../../../core/services/category.service';
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

    beforeEach(async () => {
        categories = signal<Category[]>([
            category('cat-1', 'Housing & Rent', CategoryType.Expense, 1800),
            category('cat-2', 'Groceries & Dining', CategoryType.Expense, 850),
            category('cat-3', 'Tech & Gadgets', CategoryType.Expense, 0),
            category('cat-6', 'Salary & Income', CategoryType.Income),
        ]);

        const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories'], {
            categories,
            isLoading: signal(false),
        });
        categoryServiceSpy.getCategories.and.returnValue(of([]));

        const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getSummary'], {
            summary: signal(
                summary([
                    { categoryId: 'cat-1', spent: 1550 },
                    { categoryId: 'cat-2', spent: 900 },
                ]),
            ),
        });
        dashboardServiceSpy.getSummary.and.returnValue(of(summary([])));

        await TestBed.configureTestingModule({
            imports: [CategoryListComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                ToastService,
                { provide: CategoryService, useValue: categoryServiceSpy },
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
        const cards = component.cards();
        expect(cards[0].percent).toBe(86);
        expect(cards[1].percent).toBe(100);
    });

    it('should flag an overspent category', () => {
        expect(component.cards()[0].isOverBudget).toBeFalse();
        expect(component.cards()[1].isOverBudget).toBeTrue();
        expect(fixture.nativeElement.querySelectorAll('.progress-fill--over').length).toBe(1);
        expect(fixture.nativeElement.textContent).toContain('Over Budget!');
    });

    it('should show No Limit and no bar when the cap is zero', () => {
        const card = component.cards()[2];
        expect(card.limit).toBe(0);
        expect(card.percent).toBe(0);
        expect(fixture.nativeElement.textContent).toContain('No Limit');
        expect(fixture.nativeElement.querySelectorAll('.category-track').length).toBe(2);
    });

    it('should omit the budget block for income categories', () => {
        expect(component.cards()[3].showBudget).toBeFalse();
    });

    it('should treat a category with no recorded spend as zero', () => {
        expect(component.cards()[2].spent).toBe(0);
    });

    it('should filter by search text', () => {
        component.onSearchChange('groceries');
        fixture.detectChanges();
        expect(component.cards().length).toBe(1);
        expect(fixture.nativeElement.querySelectorAll('.category-card').length).toBe(1);
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
