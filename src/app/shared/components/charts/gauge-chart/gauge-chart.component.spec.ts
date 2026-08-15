import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GaugeChartComponent } from './gauge-chart.component';

describe('GaugeChartComponent', () => {
    let fixture: ComponentFixture<GaugeChartComponent>;
    let component: GaugeChartComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GaugeChartComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GaugeChartComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('value', 65);
        fixture.componentRef.setInput('maxValue', 100);
        fixture.componentRef.setInput('subtitle', 'Burn Velocity Index (Optimal Threshold)');
        fixture.detectChanges();
    });

    it('should create and calculate percentage and arc dash stroke', () => {
        expect(component).toBeTruthy();
        expect(component.percent()).toBe(65);
        expect(component.gaugeArcDash()).toContain('251.2');
        expect(fixture.nativeElement.querySelector('.gauge-percent').textContent).toContain('65%');
        expect(fixture.nativeElement.querySelector('.gauge-sub').textContent).toContain('Optimal Threshold');
    });

    it('should emit gaugeClick on click', () => {
        const clicks: number[] = [];
        component.gaugeClick.subscribe((val) => clicks.push(val));

        fixture.nativeElement.querySelector('.gauge-chart-container').click();
        expect(clicks).toEqual([65]);
    });
});
