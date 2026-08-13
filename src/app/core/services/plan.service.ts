import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreatePlanRequest, SavingsPlan, UpdatePlanRequest } from '../models/plan.model';

@Injectable({
    providedIn: 'root',
})
export class PlanService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    plans = signal<SavingsPlan[]>([]);
    isLoading = signal<boolean>(false);

    getPlans(): Observable<SavingsPlan[]> {
        this.isLoading.set(true);
        return this.http.get<SavingsPlan[]>(`${this.apiUrl}/get-plans`).pipe(
            tap((items: SavingsPlan[]) => this.plans.set(items)),
            finalize(() => this.isLoading.set(false)),
        );
    }

    createPlan(req: CreatePlanRequest): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/create-plan`, req);
    }

    updatePlan(req: UpdatePlanRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/update-plan/${req.id}`, req);
    }

    /** Adds a contribution and patches the local signal with the server's updated plan. */
    deposit(id: string, amount: number): Observable<SavingsPlan> {
        return this.http.post<SavingsPlan>(`${this.apiUrl}/deposit-to-plan/${id}`, { amount }).pipe(
            tap((updated: SavingsPlan) =>
                this.plans.update((list) => list.map((plan) => (plan.id === id ? { ...plan, ...updated } : plan))),
            ),
        );
    }

    deletePlan(id: string): Observable<void> {
        return this.http
            .delete<void>(`${this.apiUrl}/delete-plan/${id}`)
            .pipe(tap(() => this.plans.update((list) => list.filter((plan) => plan.id !== id))));
    }
}
