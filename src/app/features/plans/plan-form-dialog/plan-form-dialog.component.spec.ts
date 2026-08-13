import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { PlanFormDialogComponent } from './plan-form-dialog.component';
import { PlanService } from '../../../core/services/plan.service';
import { ToastService } from '../../../core/services/toast.service';
import { SavingsPlan } from '../../../core/models/plan.model';

const existing: SavingsPlan = {
    id: 'p-1',
    title: 'Emergency Fund',
    currentAmount: 11250,
    targetAmount: 15000,
    color: '#3b82f6',
    deadline: '2026-12-31T00:00:00Z',
};

describe('PlanFormDialogComponent', () => {
    let fixture: ComponentFixture<PlanFormDialogComponent>;
    let component: PlanFormDialogComponent;
    let planServiceSpy: jasmine.SpyObj<PlanService>;
    let toastService: ToastService;

    beforeEach(async () => {
        planServiceSpy = jasmine.createSpyObj('PlanService', ['createPlan', 'updatePlan']);
        planServiceSpy.createPlan.and.returnValue(of('p-new'));
        planServiceSpy.updatePlan.and.returnValue(of(void 0));

        await TestBed.configureTestingModule({
            imports: [PlanFormDialogComponent, NoopAnimationsModule],
            providers: [ToastService, { provide: PlanService, useValue: planServiceSpy }],
        }).compileComponents();

        toastService = TestBed.inject(ToastService);
        fixture = TestBed.createComponent(PlanFormDialogComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => toastService.clear());

    const open = (plan: SavingsPlan | null = null) => {
        component.visible = true;
        component.plan = plan;
        component.ngOnChanges({ visible: { currentValue: true } as never });
        fixture.detectChanges();
    };

    it('should open in create mode', () => {
        open();
        expect(component.isEditMode).toBeFalse();
        expect(fixture.nativeElement.querySelector('.modal-header h3').textContent).toContain('Create Savings Plan');
    });

    it('should prefill in edit mode and trim the deadline to a date input value', () => {
        open(existing);
        expect(component.isEditMode).toBeTrue();
        expect(component.form.value.title).toBe('Emergency Fund');
        expect(component.form.value.deadline).toBe('2026-12-31');
    });

    it('should require a title, a positive target and a deadline', () => {
        open();
        component.form.patchValue({ title: '', targetAmount: 0, deadline: '' });
        expect(component.form.valid).toBeFalse();

        component.form.patchValue({ title: 'Japan Trip', targetAmount: 4500, deadline: '2026-10-15' });
        expect(component.form.valid).toBeTrue();
    });

    it('should create a plan and raise a toast', () => {
        open();
        component.form.patchValue({ title: 'Japan Trip', targetAmount: 4500, deadline: '2026-10-15' });
        component.submit();

        expect(planServiceSpy.createPlan).toHaveBeenCalledWith({
            title: 'Japan Trip',
            targetAmount: 4500,
            currentAmount: 0,
            color: '#3b82f6',
            deadline: '2026-10-15',
        });
        expect(toastService.toasts()[0].message).toBe('New savings plan created');
    });

    it('should update an existing plan', () => {
        open(existing);
        component.form.patchValue({ targetAmount: 18000 });
        component.submit();

        expect(planServiceSpy.updatePlan).toHaveBeenCalledWith(
            jasmine.objectContaining({ id: 'p-1', targetAmount: 18000 }),
        );
        expect(toastService.toasts()[0].message).toBe('Savings plan updated');
    });

    it('should surface a server error without closing', () => {
        open();
        planServiceSpy.createPlan.and.returnValue(throwError(() => ({ error: { error: 'Deadline is in the past.' } })));

        component.form.patchValue({ title: 'Old goal', targetAmount: 100, deadline: '2020-01-01' });
        component.submit();

        expect(component.errorMessage).toBe('Deadline is in the past.');
        expect(component.visible).toBeTrue();
    });
});
