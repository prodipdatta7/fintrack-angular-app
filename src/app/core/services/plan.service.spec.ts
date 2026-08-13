import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlanService } from './plan.service';
import { SavingsPlan } from '../models/plan.model';

const plan = (id: string, current: number, target: number): SavingsPlan => ({
    id,
    title: `Plan ${id}`,
    targetAmount: target,
    currentAmount: current,
    color: '#3b82f6',
    deadline: '2026-12-31',
});

describe('PlanService', () => {
    let service: PlanService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [PlanService, provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(PlanService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    const loadPlans = (plans: SavingsPlan[]) => {
        service.getPlans().subscribe();
        httpMock.expectOne('/api/get-plans').flush(plans);
    };

    it('should fetch plans and populate the signal', () => {
        loadPlans([plan('p-1', 11250, 15000), plan('p-2', 3100, 4500)]);
        expect(service.plans().length).toBe(2);
        expect(service.isLoading()).toBeFalse();
    });

    it('should patch the plan in place after a deposit', () => {
        loadPlans([plan('p-1', 11250, 15000), plan('p-2', 3100, 4500)]);

        service.deposit('p-1', 750).subscribe();
        const req = httpMock.expectOne('/api/deposit-to-plan/p-1');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ amount: 750 });
        req.flush(plan('p-1', 12000, 15000));

        expect(service.plans().find((p) => p.id === 'p-1')?.currentAmount).toBe(12000);
        expect(service.plans().find((p) => p.id === 'p-2')?.currentAmount).toBe(3100);
    });

    it('should create and update plans', () => {
        const payload = {
            title: 'Japan Fall Trip',
            targetAmount: 4500,
            currentAmount: 0,
            color: '#ec4899',
            deadline: '2026-10-15',
        };

        service.createPlan(payload).subscribe();
        const createReq = httpMock.expectOne('/api/create-plan');
        expect(createReq.request.method).toBe('POST');
        createReq.flush('p-9');

        service.updatePlan({ ...payload, id: 'p-9' }).subscribe();
        const updateReq = httpMock.expectOne('/api/update-plan/p-9');
        expect(updateReq.request.method).toBe('PUT');
        updateReq.flush(null);
    });

    it('should remove a deleted plan from the signal', () => {
        loadPlans([plan('p-1', 100, 1000), plan('p-2', 200, 2000)]);

        service.deletePlan('p-1').subscribe();
        httpMock.expectOne('/api/delete-plan/p-1').flush(null);

        expect(service.plans().map((p) => p.id)).toEqual(['p-2']);
    });
});
