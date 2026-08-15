import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeframeSelectorComponent } from './timeframe-selector.component';
import { Timeframe } from '../../../core/models/dashboard.model';

describe('TimeframeSelectorComponent', () => {
    let component: TimeframeSelectorComponent;
    let fixture: ComponentFixture<TimeframeSelectorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TimeframeSelectorComponent],
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
});
