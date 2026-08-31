import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobileExpenseDonutComponent } from './mobile-expense-donut.component';
import { Category, CategoryType } from '../../../../../core/models/category.model';
import { CategorySpend } from '../../../../../core/models/dashboard.model';
import { CurrencyStore } from '../../../../../core/services/currency.store';

const mockCategories: Category[] = [
    {
        id: 'cat-1',
        name: 'Dining Out',
        type: CategoryType.Expense,
        color: '#6366f1',
        icon: '🍔',
        budgetLimit: 1000,
        userId: 'u-1',
    },
    {
        id: 'cat-2',
        name: 'Groceries',
        type: CategoryType.Expense,
        color: '#10b981',
        icon: '🛒',
        budgetLimit: 2000,
        userId: 'u-1',
    },
    {
        id: 'cat-3',
        name: 'Salary',
        type: CategoryType.Income,
        color: '#22c55e',
        icon: '💰',
        budgetLimit: 0,
        userId: 'u-1',
    },
];

const mockCategorySpent: CategorySpend[] = [
    { categoryId: 'cat-1', spent: 800 },
    { categoryId: 'cat-2', spent: 1200 },
];

describe('MobileExpenseDonutComponent', () => {
    let component: MobileExpenseDonutComponent;
    let fixture: ComponentFixture<MobileExpenseDonutComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MobileExpenseDonutComponent],
            providers: [CurrencyStore],
        }).compileComponents();

        fixture = TestBed.createComponent(MobileExpenseDonutComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('categories', mockCategories);
        fixture.componentRef.setInput('categorySpent', mockCategorySpent);
        fixture.componentRef.setInput('totalExpense', 2000);
        fixture.componentRef.setInput('activeTimeframe', 'This Month');
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should compute donut slices for active expense categories', () => {
        const slices = component.slices();
        expect(slices.length).toBe(2);
        // Groceries is higher (1200 / 2000 = 60%)
        expect(slices[0].categoryName).toBe('Groceries');
        expect(slices[0].percent).toBe(60);
        // Dining Out is (800 / 2000 = 40%)
        expect(slices[1].categoryName).toBe('Dining Out');
        expect(slices[1].percent).toBe(40);
    });

    it('should render SVG donut segments for each active category', () => {
        const paths = fixture.nativeElement.querySelectorAll('.donut-segment');
        expect(paths.length).toBe(2);
    });

    it('should display selected category details in inspector HUD when tapped', () => {
        expect(fixture.nativeElement.querySelector('.donut-center-hud')).toBeFalsy();

        component.onSliceTouch('cat-1');
        fixture.detectChanges();

        const activeSlice = component.activeSlice();
        expect(activeSlice).toBeTruthy();
        expect(activeSlice?.categoryName).toBe('Dining Out');

        const hudCategory = fixture.nativeElement.querySelector('.donut-center-hud .hud-category-name');
        expect(hudCategory.textContent).toBe('Dining Out');
        const hudAmount = fixture.nativeElement.querySelector('.donut-center-hud .hud-amount');
        expect(hudAmount.textContent).toContain('800');
    });

    it('should show empty state when totalExpense is 0', () => {
        fixture.componentRef.setInput('totalExpense', 0);
        fixture.componentRef.setInput('categorySpent', []);
        fixture.detectChanges();

        expect(component.hasExpenses()).toBeFalse();
        expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.mobile-donut-svg')).toBeFalsy();
    });
});
