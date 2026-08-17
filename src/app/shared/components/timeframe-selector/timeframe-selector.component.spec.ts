import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeframeSelectorComponent } from './timeframe-selector.component';
import { Timeframe } from '../../../core/models/dashboard.model';
import { provideNativeDateAdapter } from '@angular/material/core';

describe('TimeframeSelectorComponent', () => {
    let component: TimeframeSelectorComponent;
    let fixture: ComponentFixture<TimeframeSelectorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TimeframeSelectorComponent],
            providers: [provideNativeDateAdapter()],
        }).compileComponents();

        fixture = TestBed.createComponent(TimeframeSelectorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create with default active timeframe This Month', () => {
        expect(component).toBeTruthy();
        expect(component.activeTimeframe()).toBe('This Month');
    });

    it('should emit timeframeChange when a different timeframe is clicked', () => {
        const emitted: Timeframe[] = [];
        component.timeframeChange.subscribe((tf) => emitted.push(tf));

        const buttons = fixture.nativeElement.querySelectorAll('.timeframe-btn');
        // Click 7D button
        const btn7D = Array.from(buttons).find((b: any) => b.textContent.trim() === '7D') as HTMLButtonElement;
        expect(btn7D).toBeTruthy();
        btn7D.click();

        expect(emitted).toEqual(['7D']);
    });

    it('should not emit timeframeChange when the already active timeframe is clicked', () => {
        const emitted: Timeframe[] = [];
        component.timeframeChange.subscribe((tf) => emitted.push(tf));

        component.selectTimeframe('This Month');
        expect(emitted.length).toBe(0);
    });

    it('should render dropdown when variant is compact or dropdown', () => {
        fixture.componentRef.setInput('variant', 'dropdown');
        fixture.detectChanges();

        const select = fixture.nativeElement.querySelector('select.timeframe-select');
        expect(select).toBeTruthy();
    });

    it('should emit timeframeChange on dropdown change', () => {
        fixture.componentRef.setInput('variant', 'dropdown');
        fixture.detectChanges();

        const emitted: Timeframe[] = [];
        component.timeframeChange.subscribe((tf) => emitted.push(tf));

        const select = fixture.nativeElement.querySelector('select.timeframe-select');
        select.value = '15D';
        select.dispatchEvent(new Event('change'));

        expect(emitted).toEqual(['15D']);
    });

    it('should render custom date range fields when activeTimeframe is Custom', () => {
        expect(fixture.nativeElement.querySelector('.custom-range-grid')).toBeNull();

        fixture.componentRef.setInput('activeTimeframe', 'Custom');
        fixture.detectChanges();

        const grid = fixture.nativeElement.querySelector('.custom-range-grid');
        expect(grid).toBeTruthy();
        const pickers = grid.querySelectorAll('app-date-picker');
        expect(pickers.length).toBe(2);
    });

    it('should emit customRangeChange when both dates are set', () => {
        fixture.componentRef.setInput('activeTimeframe', 'Custom');
        fixture.detectChanges();

        const emitted: any[] = [];
        component.customRangeChange.subscribe((range) => emitted.push(range));

        component.customStart = '2026-08-01';
        component.customEnd = '2026-08-20';
        component.emitCustomRange();

        expect(emitted).toEqual([{ from: '2026-08-01', to: '2026-08-20' }]);
    });

    it('should sync startDate and endDate inputs to internal customStart/customEnd', () => {
        fixture.componentRef.setInput('startDate', '2026-05-01');
        fixture.componentRef.setInput('endDate', '2026-05-31');
        fixture.detectChanges();

        expect(component.customStart).toBe('2026-05-01');
        expect(component.customEnd).toBe('2026-05-31');
    });

    it('should return descriptive tooltips for preset timeframes', () => {
        expect(component.getTooltip('7D')).toBe('Last 7 Days');
        expect(component.getTooltip('15D')).toBe('Last 15 Days');
        expect(component.getTooltip('30D')).toBe('Last 30 Days');
        expect(component.getTooltip('This Month')).toBe('Current Month');
        expect(component.getTooltip('6M')).toBe('Last 6 Months');
        expect(component.getTooltip('This Year')).toBe('Current Year');
        expect(component.getTooltip('Custom')).toBe('Custom Date Range');
    });
});
