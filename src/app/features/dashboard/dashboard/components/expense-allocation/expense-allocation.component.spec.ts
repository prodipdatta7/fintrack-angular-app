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
        expect(fixture.nativeElement.querySelectorAll('.matrix-item-card').length).toBe(2);
    });

    it('should compute each share against total spending', () => {
        expect(component.rows()[0].percent).toBe(63);
        expect(component.rows()[1].percent).toBe(37);
    });

    it('should flag a category that exceeded its cap', () => {
        expect(component.rows()[0].isOverBudget).toBeFalse();
        expect(component.rows()[1].isOverBudget).toBeTrue();
        expect(fixture.nativeElement.querySelectorAll('.matrix-progress-fill--over').length).toBe(1);
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
        const slices = fixture.nativeElement.querySelectorAll('.hud-slice');
        expect(slices.length).toBe(2);
        expect(slices[0].getAttribute('fill')).toBe('#6366f1');
        // cat-2 is over budget → CSS over-budget token
        expect(slices[1].getAttribute('fill')).toBe('var(--over-budget)');
        expect(component.slices()[0].percent).toBe(63);
        expect(component.slices()[1].percent).toBe(37);
    });

    it('should render total spent and channel count in the center HUD in idle state', () => {
        const hud = fixture.nativeElement.querySelector('.donut-center-hud');
        expect(hud).toBeTruthy();
        expect(hud.textContent).toContain('OUTFLOW TOTAL');
        expect(hud.textContent).toContain('2,450');
        expect(hud.textContent).toContain('2 Active Outflows');
    });

    it('should render category name, amount and share in the center HUD when hovered', () => {
        const slices = fixture.nativeElement.querySelectorAll('.hud-slice');
        slices[0].dispatchEvent(new MouseEvent('mouseenter'));
        fixture.detectChanges();

        const hud = fixture.nativeElement.querySelector('.donut-center-hud');
        expect(hud.textContent).toContain('Category cat-1');
        expect(hud.textContent).toContain('1,550');
        expect(hud.textContent).toContain('63% Share');
    });

    it('should show spent amount and percent in the hover tooltip', () => {
        const slices = fixture.nativeElement.querySelectorAll('.hud-slice');
        slices[0].dispatchEvent(new MouseEvent('mouseenter'));
        fixture.detectChanges();

        const tooltip = fixture.nativeElement.querySelector('.hud-tooltip') as HTMLElement;
        expect(tooltip).toBeTruthy();
        expect(tooltip.textContent).toContain('Category cat-1');
        expect(tooltip.textContent).toContain('1,550.00');
        expect(tooltip.textContent).toContain('63%');
    });

    it('should clear the tooltip on leave', () => {
        const slices = fixture.nativeElement.querySelectorAll('.hud-slice');
        slices[0].dispatchEvent(new MouseEvent('mouseenter'));
        fixture.detectChanges();
        slices[0].dispatchEvent(new MouseEvent('mouseleave'));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.hud-tooltip')).toBeNull();
    });

    it('should highlight the matching card while a slice is hovered', () => {
        component.onSliceEnter('cat-2');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.matrix-item-card--active')).toBeTruthy();
    });

    it('should switch visual modes between donut, flow, and gauge', () => {
        component.setVisualMode('flow');
        fixture.detectChanges();
        expect(component.visualMode()).toBe('flow');
        expect(fixture.nativeElement.querySelector('.visual-stage--flow')).toBeTruthy();

        component.setVisualMode('gauge');
        fixture.detectChanges();
        expect(component.visualMode()).toBe('gauge');
        expect(fixture.nativeElement.querySelector('.visual-stage--gauge')).toBeTruthy();

        component.setVisualMode('donut');
        fixture.detectChanges();
        expect(component.visualMode()).toBe('donut');
        expect(fixture.nativeElement.querySelector('.visual-stage--donut')).toBeTruthy();
    });

    it('should filter matrix list by search input', () => {
        component.searchQuery.set('cat-1');
        fixture.detectChanges();
        expect(component.filteredRows().length).toBe(1);
        expect(component.filteredRows()[0].category.id).toBe('cat-1');
    });

    it('should filter matrix list by active tab', () => {
        component.setFilterTab('active');
        fixture.detectChanges();
        expect(component.filteredRows().length).toBe(2);

        component.setFilterTab('all');
        fixture.detectChanges();
        expect(component.filteredRows().length).toBe(2);
    });

    it('should display 4 items initially, expand on button click, and collapse', () => {
        const manyCategories = Array.from({ length: 8 }, (_, i) =>
            category(`cat-${i + 1}`, CategoryType.Expense, 1000),
        );
        const manySpent = Array.from({ length: 8 }, (_, i) => ({
            categoryId: `cat-${i + 1}`,
            spent: (i + 1) * 100,
        }));

        fixture.componentRef.setInput('categories', manyCategories);
        fixture.componentRef.setInput('categorySpent', manySpent);
        fixture.componentRef.setInput('totalExpense', 3600);
        fixture.detectChanges();

        expect(component.rows().length).toBe(8);
        expect(component.visibleRows().length).toBe(4);
        expect(fixture.nativeElement.querySelectorAll('.matrix-item-card').length).toBe(4);

        const toggleBtn = fixture.nativeElement.querySelector('.btn-matrix-toggle') as HTMLButtonElement;
        expect(toggleBtn).toBeTruthy();
        expect(toggleBtn.textContent).toContain('Show 4 More Channels');

        toggleBtn.click();
        fixture.detectChanges();

        expect(component.isExpanded()).toBeTrue();
        expect(component.visibleRows().length).toBe(8);
        expect(fixture.nativeElement.querySelectorAll('.matrix-item-card').length).toBe(8);
        expect(toggleBtn.textContent).toContain('Collapse Category Matrix');
    });

    it('should navigate to categories module on header button click', () => {
        const navigateSpy = spyOn(router, 'navigate');
        const headerBtn = fixture.nativeElement.querySelector('.btn-hud-action') as HTMLButtonElement;
        headerBtn.click();
        expect(navigateSpy).toHaveBeenCalledWith(['/categories']);
    });

    it('should render custom title and kicker when provided', () => {
        fixture.componentRef.setInput('title', 'Source Burn & Category Allocation');
        fixture.componentRef.setInput('kickerTitle', 'LIVE ACCOUNT OUTFLOW');
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.hud-title').textContent).toContain('Source Burn & Category Allocation');
        expect(fixture.nativeElement.querySelector('.hud-kicker-title').textContent).toContain('LIVE ACCOUNT OUTFLOW');
    });

    it('should render timeframe selector and emit timeframeChange when showTimeframeSwitch is enabled', () => {
        fixture.componentRef.setInput('showTimeframeSwitch', true);
        fixture.componentRef.setInput('activeTimeframe', '7D');
        fixture.detectChanges();

        const selectorEl = fixture.nativeElement.querySelector('app-timeframe-selector');
        expect(selectorEl).toBeTruthy();

        const emitted: any[] = [];
        component.timeframeChange.subscribe((tf) => emitted.push(tf));

        const buttons = selectorEl.querySelectorAll('.timeframe-btn');
        const thisMonthBtn = Array.from(buttons).find((b: any) => b.textContent.trim() === 'This Month') as HTMLButtonElement;
        expect(thisMonthBtn).toBeTruthy();
        thisMonthBtn.click();

        expect(emitted).toEqual(['This Month']);
    });

    it('should render upper 4 bento metric cards with accurate values', () => {
        const bentoCards = fixture.nativeElement.querySelectorAll('.bento-card');
        expect(bentoCards.length).toBe(4);

        expect(bentoCards[0].textContent).toContain('TOTAL SPENT');
        expect(bentoCards[0].textContent).toContain('2,450');

        expect(bentoCards[1].textContent).toContain('DAILY PACE');

        expect(bentoCards[2].textContent).toContain('ACTIVE CHANNELS');
        expect(bentoCards[2].textContent).toContain('2 of 2 total');

        expect(bentoCards[3].textContent).toContain('TOP SECTOR');
        expect(bentoCards[3].textContent).toContain('Category cat-1');
        expect(bentoCards[3].textContent).toContain('1,550');
    });
});
