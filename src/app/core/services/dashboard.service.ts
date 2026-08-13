import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, finalize, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CashflowPoint, CashflowQuery, DashboardSummary, SummaryQuery, Timeframe } from '../models/dashboard.model';

/**
 * Aggregates are computed server-side: the transactions API is paginated, so any
 * total derived from a single page would be wrong.
 */
@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    summary = signal<DashboardSummary | null>(null);
    cashflow = signal<CashflowPoint[]>([]);
    isLoadingSummary = signal<boolean>(false);
    isLoadingCashflow = signal<boolean>(false);

    getSummary(query: SummaryQuery = {}): Observable<DashboardSummary> {
        this.isLoadingSummary.set(true);
        return this.http
            .get<DashboardSummary>(`${this.apiUrl}/get-dashboard-summary`, { params: this.toParams(query) })
            .pipe(
                tap((res: DashboardSummary) => this.summary.set(res)),
                finalize(() => this.isLoadingSummary.set(false)),
            );
    }

    getCashflow(timeframe: Timeframe, query: CashflowQuery = {}): Observable<CashflowPoint[]> {
        this.isLoadingCashflow.set(true);
        const params = this.toParams({ ...query }).set('timeframe', timeframe);
        return this.http.get<CashflowPoint[]>(`${this.apiUrl}/get-cashflow`, { params }).pipe(
            tap((points: CashflowPoint[]) => this.cashflow.set(points)),
            finalize(() => this.isLoadingCashflow.set(false)),
        );
    }

    private toParams(query: SummaryQuery | CashflowQuery): HttpParams {
        let params = new HttpParams();
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== null && value !== '') {
                params = params.set(key, value);
            }
        }
        return params;
    }
}
