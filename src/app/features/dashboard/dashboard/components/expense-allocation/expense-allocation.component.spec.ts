import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ExpenseAllocationComponent } from './expense-allocation.component';
import { Category, CategoryType } from '../../../../../core/models/category.model';

const category = (id: string, type: CategoryType, budgetLimit = 0, color = '#6366f1'): Category => ({
    id,
    name: `Category ${id}`,
    icon: '🏠',
    color,
    type,
    budgetLimit,
    userId: 'u-1',
});

describe('ExpenseAllocationComponent', () => {
    let fixture: ComponentFixture<ExpenseAllocationComponent>;
    let component: ExpenseAllocationComponent;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExpenseAllocationComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(ExpenseAllocationComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('categories', [
            category('cat-1', CategoryType.Expense, 1800, '#6366f1'),
            category('cat-2', CategoryType.Expense, 850, '#22c55e'),
            category('cat-6', CategoryType.Income, 0, '#f59e0b'),
        ]);
        fixture.componentRef.setInput('categorySpent', [
            { categoryId: 'cat-1', spent: 1550 },
            { categoryId: 'cat-2', spent: 900 },
        ]);
        fixture.componentRef.setInput('totalExpense', 2450);
        fixture.detectChanges();
    });

    it('should list expense categories only and sort by highest spent descending', () => {
        expect(component.rows().map((row) => row.category.id)).toEqual(['cat-1', 'cat-2']);
        expect(fixture.nativeElement.querySelectorAll('.allocation-row').length).toBe(2);
    });

    it('should compute each share against total spending', () => {
        expect(component.rows()[0].percent).toBe(63);
        expect(component.rows()[1].percent).toBe(37);
    });

    it('should flag a category that exceeded its cap', () => {
        expect(component.rows()[0].isOverBudget).toBeFalse();
        expect(component.rows()[1].isOverBudget).toBeTrue();
        expect(fixture.nativeElement.querySelectorAll('.progress-fill--over').length).toBe(1);
    });

    it('should treat a missing spend entry as zero', () => {
        fixture.componentRef.setInput('categorySpent', []);
        fixture.detectChanges();
        expect(component.rows().every((row) => row.spent === 0)).toBeTrue();
        expect(component.rows()[0].percent).toBe(0);
        expect(component.slices().length).toBe(0);
    });

    it('should not divide by zero when nothing was spent', () => {
        fixture.componentRef.setInput('totalExpense', 0);
        fixture.detectChanges();
        expect(component.rows().every((row) => Number.isFinite(row.percent))).toBeTrue();
    });

    it('should show an empty state with no expense categories', () => {
        fixture.componentRef.setInput('categories', [category('cat-6', CategoryType.Income)]);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
    });

    it('should render a pie slice per category with spend, using category colors', () => {
        const slices = fixture.nativeElement.querySelectorAll('.allocation-slice');
        expect(slices.length).toBe(2);
        expect(slices[0].getAttribute('fill')).toBe('#6366f1');
        // cat-2 is over budget → CSS over-budget token
        expect(slices[1].getAttribute('fill')).toBe('var(--over-budget)');
        expect(component.slices()[0].percent).toBe(63);
        expect(component.slices()[1].percent).toBe(37);
    });

    it('should render total spent and channel count in the center HUD in idle state', () => {
        const hud = fixture.nativeElement.querySelector('.allocation-center-hud');
        expect(hud).toBeTruthy();
        expect(hud.textContent).toContain('TOTAL SPENT');
        expect(hud.textContent).toContain('2,450');
        expect(hud.textContent).toContain('2 Channels');
    });

    it('should render category name, amount and share in the center HUD when hovered', () => {
        component.onSliceEnter('cat-1');
        fixture.detectChanges();

        const hud = fixture.nativeElement.querySelector('.allocation-center-hud');
        expect(hud.textContent).toContain('Category cat-1');
        expect(hud.textContent).toContain('1,550');
        expect(hud.textContent).toContain('63% Share');
    });

    it('should show spent amount and percent in the hover tooltip', () => {
        component.onSliceEnter('cat-1');
        fixture.detectChanges();

        const tooltip = fixture.nativeElement.querySelector('.allocation-tooltip') as HTMLElement;
        expect(tooltip).toBeTruthy();
        expect(tooltip.textContent).toContain('Category cat-1');
        expect(tooltip.textContent).toContain('1,550.00');
        expect(tooltip.textContent).not.toContain('$');
        expect(tooltip.textContent).toContain('63%');
    });

    it('should clear the tooltip on leave', () => {
        component.onSliceEnter('cat-1');
        fixture.detectChanges();
        component.onSliceLeave();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.allocation-tooltip')).toBeNull();
    });

    it('should highlight the matching legend row while a slice is hovered', () => {
        component.onSliceEnter('cat-2');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.allocation-row--active')).toBeTruthy();
    });

    it('should display 4 items initially, expand up to max 10, and show Categories button for excess', () => {
        const manyCategories = Array.from({ length: 12 }, (_, i) =>
            category(`cat-${i + 1}`, CategoryType.Expense, 1000),
        );
        const manySpent = Array.from({ length: 12 }, (_, i) => ({
            categoryId: `cat-${i + 1}`,
            spent: (i + 1) * 100,
        }));

        fixture.componentRef.setInput('categories', manyCategories);
        fixture.componentRef.setInput('categorySpent', manySpent);
        fixture.componentRef.setInput('totalExpense', 7800);
        fixture.detectChanges();

        expect(component.rows().length).toBe(12);
        expect(component.visibleRows().length).toBe(4);
        expect(fixture.nativeElement.querySelectorAll('.allocation-row').length).toBe(4);

        const expandBtn = fixture.nativeElement.querySelector('.btn-allocation-expand') as HTMLButtonElement;
        expect(expandBtn).toBeTruthy();
        expect(expandBtn.textContent).toContain('Show 6 More Categories');

        const catBtn = fixture.nativeElement.querySelector('.btn-allocation-more-cat') as HTMLButtonElement;
        expect(catBtn).toBeTruthy();
        expect(catBtn.textContent).toContain('+2 more in Categories');

        expandBtn.click();
        fixture.detectChanges();

        expect(component.isExpanded()).toBeTrue();
        expect(component.visibleRows().length).toBe(10);
        expect(fixture.nativeElement.querySelectorAll('.allocation-row').length).toBe(10);
        expect(expandBtn.textContent).toContain('Show Top 4 Only');

        const navigateSpy = spyOn(router, 'navigate');
        catBtn.click();
        expect(navigateSpy).toHaveBeenCalledWith(['/categories']);
    });

    it('should navigate to categories module on header button click', () => {
        const navigateSpy = spyOn(router, 'navigate');
        const headerBtn = fixture.nativeElement.querySelector('.btn-allocation-nav') as HTMLButtonElement;
        headerBtn.click();
        expect(navigateSpy).toHaveBeenCalledWith(['/categories']);
    });
});
