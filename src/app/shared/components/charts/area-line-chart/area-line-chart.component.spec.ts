import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaLineChartComponent } from './area-line-chart.component';
import { ChartPointData, ChartSeries } from '../chart.types';

const testPoints: ChartPointData[] = [
    { label: 'Jan', values: { income: 4500, expense: 2000 } },
    { label: 'Feb', values: { income: 5200, expense: 2800 } },
    { label: 'Mar', values: { income: 4800, expense: 2300 } },
];

const testSeries: ChartSeries[] = [
    { key: 'income', label: 'Inflow', color: '#22c55e' },
    { key: 'expense', label: 'Outflow', color: '#ef4444' },
];

describe('AreaLineChartComponent', () => {
    let fixture: ComponentFixture<AreaLineChartComponent>;
    let component: AreaLineChartComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AreaLineChartComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(AreaLineChartComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('points', testPoints);
        fixture.componentRef.setInput('series', testSeries);
        fixture.detectChanges();
    });

    it('should create and render lines, areas, and legends', () => {
        expect(component).toBeTruthy();
        expect(component.plottedPoints().length).toBe(3);
        expect(component.plottedSeries().length).toBe(2);

        expect(fixture.nativeElement.querySelectorAll('.chart-line').length).toBe(2);
        expect(fixture.nativeElement.querySelectorAll('.legend-item').length).toBe(2);
    });

    it('should emit pointHover on hover and show tooltip', () => {
        const hovered: (number | null)[] = [];
        component.pointHover.subscribe((idx) => hovered.push(idx));

        component.setHovered(1);
        fixture.detectChanges();

        expect(hovered).toEqual([1]);
        const tooltip = fixture.nativeElement.querySelector('.chart-tooltip');
        expect(tooltip).toBeTruthy();
        expect(tooltip.textContent).toContain('Feb Metrics');
        expect(tooltip.textContent).toContain('5,200');
        expect(tooltip.textContent).toContain('2,800');
    });

    it('should show empty state when points array is empty', () => {
        fixture.componentRef.setInput('points', []);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.chart-empty')).toBeTruthy();
    });
});
