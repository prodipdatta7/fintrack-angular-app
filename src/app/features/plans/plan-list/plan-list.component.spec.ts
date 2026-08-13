import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { PlanListComponent } from './plan-list.component';
import { PlanService } from '../../../core/services/plan.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { SavingsPlan } from '../../../core/models/plan.model';

const plan = (id: string, current: number, target: number, deadline = '2027-12-31'): SavingsPlan => ({
    id,
    title: `Plan ${id}`,
    currentAmount: current,
    targetAmount: target,
    color: '#3b82f6',
    deadline,
});

describe('PlanListComponent', () => {
    let fixture: ComponentFixture<PlanListComponent>;
    let component: PlanListComponent;
    let plans: ReturnType<typeof signal<SavingsPlan[]>>;
    let planServiceSpy: jasmine.SpyObj<PlanService>;
    let confirmSpy: jasmine.SpyObj<ConfirmDialogService>;
    let toastService: ToastService;

    beforeEach(async () => {
        plans = signal<SavingsPlan[]>([plan('p-1', 11250, 15000), plan('p-2', 3100, 4500)]);

        planServiceSpy = jasmine.createSpyObj('PlanService', ['getPlans', 'deposit', 'deletePlan'], {
            plans,
            isLoading: signal(false),
        });
        planServiceSpy.getPlans.and.returnValue(of(plans()));
        planServiceSpy.deposit.and.returnValue(of(plan('p-1', 12000, 15000)));
        planServiceSpy.deletePlan.and.returnValue(of(void 0));

        confirmSpy = jasmine.createSpyObj('ConfirmDialogService', ['confirmDelete', 'open']);
        confirmSpy.confirmDelete.and.returnValue(of(true));

        await TestBed.configureTestingModule({
            imports: [PlanListComponent, NoopAnimationsModule],
            providers: [
                ToastService,
                { provide: PlanService, useValue: planServiceSpy },
                { provide: ConfirmDialogService, useValue: confirmSpy },
            ],
        }).compileComponents();

        toastService = TestBed.inject(ToastService);
        fixture = TestBed.createComponent(PlanListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => toastService.clear());

    it('should render one card per plan with its progress', () => {
        expect(fixture.nativeElement.querySelectorAll('.plan-card').length).toBe(2);
        expect(component.cards().map((card) => card.percent)).toEqual([75, 69]);
    });

    it('should clamp a completed plan and label it', () => {
        plans.set([plan('p-1', 20000, 15000)]);
        fixture.detectChanges();

        expect(component.cards()[0].percent).toBe(100);
        expect(component.cards()[0].isComplete).toBeTrue();
        expect(fixture.nativeElement.querySelector('.plan-percent').textContent.trim()).toBe('Completed');
    });

    it('should flag an overdue plan', () => {
        plans.set([plan('p-1', 100, 1000, '2020-01-01')]);
        fixture.detectChanges();

        expect(component.cards()[0].isOverdue).toBeTrue();
        expect(fixture.nativeElement.querySelector('.plan-overdue')).toBeTruthy();
    });

    it('should guard a zero target instead of showing Infinity', () => {
        plans.set([plan('p-1', 500, 0)]);
        fixture.detectChanges();

        expect(component.cards()[0].percent).toBe(0);
        expect(component.cards()[0].hasTarget).toBeFalse();
        expect(fixture.nativeElement.querySelector('.plan-percent').textContent.trim()).toBe('—');
    });

    it('should deposit a contribution and raise a toast', () => {
        component.startDeposit(plans()[0]);
        component.depositAmount.set('750');
        component.deposit(plans()[0]);

        expect(planServiceSpy.deposit).toHaveBeenCalledWith('p-1', 750);
        expect(toastService.toasts()[0].message).toBe('Added $750 contribution to plan!');
        expect(component.depositingId()).toBeNull();
    });

    it('should reject a non-positive contribution with a visible message', () => {
        component.startDeposit(plans()[0]);
        component.depositAmount.set('0');
        component.deposit(plans()[0]);

        expect(planServiceSpy.deposit).not.toHaveBeenCalled();
        expect(component.depositError()).toBe('Enter an amount greater than zero');
        expect(component.depositingId()).toBe('p-1');
    });

    it('should reject an empty contribution', () => {
        component.startDeposit(plans()[0]);
        component.deposit(plans()[0]);
        expect(planServiceSpy.deposit).not.toHaveBeenCalled();
    });

    it('should report a failed contribution', () => {
        planServiceSpy.deposit.and.returnValue(throwError(() => new Error('boom')));

        component.startDeposit(plans()[0]);
        component.depositAmount.set('100');
        component.deposit(plans()[0]);

        expect(component.depositError()).toBe('Could not record the contribution');
    });

    it('should keep only one card in deposit mode', () => {
        component.startDeposit(plans()[0]);
        component.startDeposit(plans()[1]);
        fixture.detectChanges();

        expect(component.depositingId()).toBe('p-2');
        expect(fixture.nativeElement.querySelectorAll('.deposit-row').length).toBe(1);
    });

    it('should clear the draft amount when cancelled', () => {
        component.startDeposit(plans()[0]);
        component.depositAmount.set('42');
        component.cancelDeposit();

        expect(component.depositingId()).toBeNull();
        expect(component.depositAmount()).toBe('');
    });

    it('should open the dialog in create and edit modes', () => {
        component.openCreate();
        expect(component.showDialog).toBeTrue();
        expect(component.editingPlan).toBeNull();

        component.openEdit(plans()[1]);
        expect(component.editingPlan?.id).toBe('p-2');
    });

    it('should delete behind the confirm dialog', () => {
        component.deletePlan(plans()[0]);

        expect(confirmSpy.confirmDelete).toHaveBeenCalled();
        expect(planServiceSpy.deletePlan).toHaveBeenCalledWith('p-1');
        expect(toastService.toasts()[0].message).toBe('Savings plan removed');
    });

    it('should not delete when the dialog is dismissed', () => {
        confirmSpy.confirmDelete.and.returnValue(of(false));
        component.deletePlan(plans()[0]);
        expect(planServiceSpy.deletePlan).not.toHaveBeenCalled();
    });

    it('should show an empty state on a fresh account', () => {
        plans.set([]);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.plans-empty')).toBeTruthy();
    });
});
