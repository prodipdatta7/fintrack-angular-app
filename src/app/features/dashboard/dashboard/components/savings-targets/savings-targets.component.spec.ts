import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SavingsTargetsComponent } from './savings-targets.component';
import { SavingsPlan } from '../../../../../core/models/plan.model';

const plan = (id: string, current: number, target: number): SavingsPlan => ({
    id,
    title: `Plan ${id}`,
    currentAmount: current,
    targetAmount: target,
    color: '#3b82f6',
    deadline: '2026-12-31',
});

describe('SavingsTargetsComponent', () => {
    let fixture: ComponentFixture<SavingsTargetsComponent>;
    let component: SavingsTargetsComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SavingsTargetsComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(SavingsTargetsComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('plans', [plan('p-1', 11250, 15000), plan('p-2', 3100, 4500)]);
        fixture.detectChanges();
    });

    it('should render one row per plan with its progress', () => {
        expect(fixture.nativeElement.querySelectorAll('.target').length).toBe(2);
        expect(component.rows().map((row) => row.percent)).toEqual([75, 69]);
    });

    it('should clamp a completed plan at 100%', () => {
        fixture.componentRef.setInput('plans', [plan('p-1', 20000, 15000)]);
        fixture.detectChanges();
        expect(component.rows()[0].percent).toBe(100);
    });

    it('should guard a zero target', () => {
        fixture.componentRef.setInput('plans', [plan('p-1', 500, 0)]);
        fixture.detectChanges();
        expect(component.rows()[0].percent).toBe(0);
    });

    it('should show an empty state with no plans', () => {
        fixture.componentRef.setInput('plans', []);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
    });
});
