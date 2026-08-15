import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlowChartComponent } from './flow-chart.component';
import { FlowStream } from '../chart.types';

const testStreams: FlowStream[] = [
    { id: '1', name: 'Housing', percent: 60, color: '#6366f1' },
    { id: '2', name: 'Food', percent: 40, color: '#22c55e' },
];

describe('FlowChartComponent', () => {
    let fixture: ComponentFixture<FlowChartComponent>;
    let component: FlowChartComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FlowChartComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(FlowChartComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('streams', testStreams);
        fixture.componentRef.setInput('sourceLabel', 'PRIMARY ACCOUNT');
        fixture.detectChanges();
    });

    it('should create and render source node and target category nodes', () => {
        expect(component).toBeTruthy();
        expect(component.computedStreams().length).toBe(2);
        expect(fixture.nativeElement.querySelector('.source-node-group').textContent).toContain('PRIMARY ACCOUNT');
        expect(fixture.nativeElement.querySelectorAll('.target-node-group').length).toBe(2);
    });

    it('should emit streamHover on mouse enter and leave', () => {
        const hovered: (string | null)[] = [];
        component.streamHover.subscribe((id) => hovered.push(id));

        component.onStreamEnter('1');
        expect(hovered).toEqual(['1']);

        component.onStreamLeave();
        expect(hovered).toEqual(['1', null]);
    });

    it('should emit streamSelect on target node click', () => {
        const selected: FlowStream[] = [];
        component.streamSelect.subscribe((s) => selected.push(s));

        const targetGroup = fixture.nativeElement.querySelector('.target-node-group');
        targetGroup.dispatchEvent(new MouseEvent('click'));

        expect(selected.length).toBe(1);
        expect(selected[0].id).toBe('1');
    });
});
