import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DonutChartComponent } from './donut-chart.component';
import { DonutSlice } from '../chart.types';

const testSlices: DonutSlice[] = [
    { id: '1', name: 'Housing', value: 1500, percent: 60, color: '#6366f1' },
    { id: '2', name: 'Food', value: 1000, percent: 40, color: '#22c55e' },
];

describe('DonutChartComponent', () => {
    let fixture: ComponentFixture<DonutChartComponent>;
    let component: DonutChartComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DonutChartComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DonutChartComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('slices', testSlices);
        fixture.componentRef.setInput('totalValue', 2500);
        fixture.detectChanges();
    });

    it('should create and render all active slices', () => {
        expect(component).toBeTruthy();
        expect(component.computedSlices().length).toBe(2);
        const paths = fixture.nativeElement.querySelectorAll('.hud-slice');
        expect(paths.length).toBe(2);
    });

    it('should render center HUD with total amount and active channels', () => {
        const hud = fixture.nativeElement.querySelector('.donut-center-hud');
        expect(hud).toBeTruthy();
        expect(hud.textContent).toContain('OUTFLOW TOTAL');
        expect(hud.textContent).toContain('2,500');
        expect(hud.textContent).toContain('2 Active Outflows');
    });

    it('should emit sliceHover on hover and show category breakdown in center HUD', () => {
        const hovered: (string | null)[] = [];
        component.sliceHover.subscribe((id) => hovered.push(id));

        component.onSliceEnter('1');
        fixture.detectChanges();

        expect(hovered).toEqual(['1']);
        expect(component.hoveredSlice()?.name).toBe('Housing');
        const hud = fixture.nativeElement.querySelector('.donut-center-hud');
        expect(hud.textContent).toContain('Housing');
        expect(hud.textContent).toContain('1,500');
        expect(hud.textContent).toContain('60% Share');
    });

    it('should render empty state when no slices have values', () => {
        fixture.componentRef.setInput('slices', []);
        fixture.componentRef.setInput('totalValue', 0);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.stage-empty-pie')).toBeTruthy();
        expect(fixture.nativeElement.querySelectorAll('.hud-slice').length).toBe(0);
    });

    it('should emit sliceSelect on click', () => {
        const selected: DonutSlice[] = [];
        component.sliceSelect.subscribe((s) => selected.push(s));

        const paths = fixture.nativeElement.querySelectorAll('.hud-slice');
        paths[0].dispatchEvent(new MouseEvent('click'));

        expect(selected.length).toBe(1);
        expect(selected[0].id).toBe('1');
    });
});
