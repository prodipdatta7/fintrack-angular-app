import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CashflowChartComponent } from './cashflow-chart.component';
import { CashflowPoint, Timeframe } from '../../../core/models/dashboard.model';
import { createScale, smoothPath } from '../../utils/chart-geometry';

const points: CashflowPoint[] = [
    { label: 'Mar', income: 5800, expense: 2300 },
    { label: 'Apr', income: 6100, expense: 2850 },
    { label: 'May', income: 5900, expense: 2100 },
];

describe('CashflowChartComponent', () => {
    let fixture: ComponentFixture<CashflowChartComponent>;
    let component: CashflowChartComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [CashflowChartComponent] }).compileComponents();
        fixture = TestBed.createComponent(CashflowChartComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('points', points);
        fixture.detectChanges();
    });

    it('should draw the income line using the shared geometry', () => {
        const expected = smoothPath(points, 'income', createScale(points));
        expect(component.incomeLine()).toBe(expected);
        expect(fixture.nativeElement.querySelector('.chart-line--income').getAttribute('d')).toBe(expected);
    });

    it('should close the area paths back to the baseline', () => {
        expect(component.incomeArea().endsWith('Z')).toBeTrue();
        expect(component.expenseArea().endsWith('Z')).toBeTrue();
    });

    it('should render one dot pair and one axis label per point', () => {
        expect(fixture.nativeElement.querySelectorAll('.chart-dot--income').length).toBe(3);
        expect(fixture.nativeElement.querySelectorAll('.chart-dot--expense').length).toBe(3);
        expect(fixture.nativeElement.querySelectorAll('.chart-axis-label').length).toBe(3);
    });

    it('should give each instance its own gradient ids', () => {
        const second = TestBed.createComponent(CashflowChartComponent);
        second.componentRef.setInput('points', points);
        second.detectChanges();

        expect(component.uid).not.toBe(second.componentInstance.uid);
        const firstId = fixture.nativeElement.querySelector('linearGradient').getAttribute('id');
        const secondId = second.nativeElement.querySelector('linearGradient').getAttribute('id');
        expect(firstId).not.toBe(secondId);
    });

    it('should show a tooltip with income, expense and net on hover', () => {
        component.setHovered(1);
        fixture.detectChanges();

        const tooltip = fixture.nativeElement.querySelector('.chart-tooltip') as HTMLElement;
        expect(tooltip).toBeTruthy();
        expect(tooltip.textContent).toContain('Apr Metrics');
        expect(tooltip.textContent).toContain('6,100.00');
        expect(tooltip.textContent).toContain('2,850.00');
        expect(tooltip.textContent).toContain('Net Surplus');
        expect(tooltip.textContent).toContain('3,250.00');
        expect(tooltip.textContent).not.toContain('$');
    });

    it('should hide the net row when disabled', () => {
        fixture.componentRef.setInput('showNetRow', false);
        component.setHovered(0);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.chart-tooltip').textContent).not.toContain('Net Surplus');
    });

    it('should clamp the tooltip position at both edges', () => {
        component.setHovered(0);
        expect(component.hovered()?.left).toBe(5);

        component.setHovered(2);
        expect(component.hovered()?.left).toBe(75);
    });

    it('should render a crosshair only for the hovered point', () => {
        expect(fixture.nativeElement.querySelectorAll('.chart-crosshair').length).toBe(0);
        component.setHovered(2);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('.chart-crosshair').length).toBe(1);
    });

    it('should emit the selected timeframe but not the active one', () => {
        const emitted: Timeframe[] = [];
        component.timeframeChange.subscribe((tf) => emitted.push(tf));

        component.selectTimeframe('6M');
        component.selectTimeframe('7D');

        expect(emitted).toEqual(['7D']);
    });

    it('should emit a custom range only once both dates are set', () => {
        const emitted: unknown[] = [];
        component.customRangeChange.subscribe((range) => emitted.push(range));

        component.customStart = '2026-07-01';
        component.emitCustomRange();
        expect(emitted.length).toBe(0);

        component.customEnd = '2026-08-10';
        component.emitCustomRange();
        expect(emitted).toEqual([{ from: '2026-07-01', to: '2026-08-10' }]);
    });

    it('should reveal the custom date row for the Custom timeframe', () => {
        expect(fixture.nativeElement.querySelector('.custom-range')).toBeNull();
        fixture.componentRef.setInput('activeTimeframe', 'Custom');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.custom-range')).toBeTruthy();
    });

    it('should show an empty state instead of a plot when there are no points', () => {
        fixture.componentRef.setInput('points', []);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.chart-svg')).toBeNull();
        expect(fixture.nativeElement.querySelector('.chart-empty')).toBeTruthy();
    });

    it('should show a skeleton while loading', () => {
        fixture.componentRef.setInput('isLoading', true);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.chart-skeleton')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.chart-svg')).toBeNull();
    });

    it('should expose a text alternative of the series', () => {
        const table = fixture.nativeElement.querySelector('table.visually-hidden') as HTMLElement;
        expect(table.querySelectorAll('tbody tr').length).toBe(3);
        expect(fixture.nativeElement.querySelector('.chart-svg').getAttribute('aria-label')).toContain('17800.00');
    });

    it('should decimate axis labels on 30-day view to prevent overlapping text', () => {
        const points30: CashflowPoint[] = Array.from({ length: 30 }, (_, i) => ({
            label: `Aug ${String(i + 1).padStart(2, '0')}`,
            income: 5000 + i * 10,
            expense: 2000 + i * 5,
        }));
        fixture.componentRef.setInput('points', points30);
        fixture.detectChanges();

        const labels = fixture.nativeElement.querySelectorAll('.chart-axis-label');
        expect(labels.length).toBe(7);
        expect(labels[0].textContent.trim()).toBe('Aug 01');
        expect(labels[labels.length - 1].textContent.trim()).toBe('Aug 30');
    });

    it('should decimate axis labels on 60-day view to prevent overlapping text', () => {
        const points60: CashflowPoint[] = Array.from({ length: 60 }, (_, i) => ({
            label: `D${i + 1}`,
            income: 4000 + i * 10,
            expense: 1800 + i * 5,
        }));
        fixture.componentRef.setInput('points', points60);
        fixture.detectChanges();

        const labels = fixture.nativeElement.querySelectorAll('.chart-axis-label');
        expect(labels.length).toBe(7);
        expect(labels[0].textContent.trim()).toBe('D1');
        expect(labels[labels.length - 1].textContent.trim()).toBe('D60');
    });
});

