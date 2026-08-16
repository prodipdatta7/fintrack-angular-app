import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    CreateTransactionRequest,
    Transaction,
    TransactionPagedResult,
    UpdateTransactionRequest,
} from '../models/transaction.model';
import { TransactionEvent } from '../models/transaction-event.model';

export type TransactionSort = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'title-asc';

export interface TransactionQueryFilters {
    accountId?: string;
    fromDate?: string;
    toDate?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: TransactionSort;
}

@Injectable({
    providedIn: 'root',
})
export class TransactionService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    transactions = signal<Transaction[]>([]);
    /** Unfiltered ledger size — sidebar / admin badge. */
    totalCount = signal<number>(0);
    /** Current list query total — paginator (may be filtered). */
    listTotalCount = signal<number>(0);
    isLoading = signal<boolean>(false);

    getTransactions(
        page = 1,
        pageSize = 10,
        categoryId?: string,
        type?: number,
        searchTerm?: string,
        filters: TransactionQueryFilters = {},
    ): Observable<TransactionPagedResult> {
        this.isLoading.set(true);
        const params = this.buildParams(page, pageSize, categoryId, type, searchTerm, filters);
        const filtered = this.isFiltered(categoryId, type, searchTerm, filters);

        return this.http.get<TransactionPagedResult>(`${this.apiUrl}/get-transactions`, { params }).pipe(
            tap((res: TransactionPagedResult) => {
                this.transactions.set(res.items);
                this.listTotalCount.set(res.totalCount);
                // Keep the nav badge on the full ledger size while filters are active.
                if (!filtered) {
                    this.totalCount.set(res.totalCount);
                }
            }),
            finalize(() => this.isLoading.set(false)),
        );
    }

    /**
     * Seeds / refreshes the unfiltered total used by the sidebar badge without
     * touching the transactions list signal.
     */
    refreshTotalCount(): Observable<number> {
        return this.queryTransactions(1, 1).pipe(
            tap((res) => this.totalCount.set(res.totalCount)),
            map((res) => res.totalCount),
        );
    }

    /**
     * One-off query that leaves the shared list signals alone — used by views
     * that show a *subset* of the ledger (e.g. one account) and must not
     * overwrite the counts the transactions page and sidebar rely on.
     */
    queryTransactions(
        page = 1,
        pageSize = 10,
        categoryId?: string,
        type?: number,
        searchTerm?: string,
        filters: TransactionQueryFilters = {},
    ): Observable<TransactionPagedResult> {
        const params = this.buildParams(page, pageSize, categoryId, type, searchTerm, filters);
        return this.http.get<TransactionPagedResult>(`${this.apiUrl}/get-transactions`, { params });
    }

    private isFiltered(
        categoryId?: string,
        type?: number,
        searchTerm?: string,
        filters: TransactionQueryFilters = {},
    ): boolean {
        return !!(
            categoryId ||
            (type !== undefined && type !== null) ||
            searchTerm ||
            filters.accountId ||
            filters.fromDate ||
            filters.toDate ||
            (filters.minAmount !== undefined && filters.minAmount !== null) ||
            (filters.maxAmount !== undefined && filters.maxAmount !== null)
        );
    }

    private buildParams(
        page: number,
        pageSize: number,
        categoryId?: string,
        type?: number,
        searchTerm?: string,
        filters: TransactionQueryFilters = {},
    ): HttpParams {
        let params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());

        if (categoryId) params = params.set('categoryId', categoryId);
        if (type !== undefined && type !== null) params = params.set('type', type.toString());
        if (searchTerm) params = params.set('searchTerm', searchTerm);

        // Filtering and sorting run server-side: results span pages, so narrowing
        // the current page in memory would silently produce the wrong answer.
        if (filters.accountId) params = params.set('accountId', filters.accountId);
        if (filters.fromDate) params = params.set('fromDate', filters.fromDate);
        if (filters.toDate) params = params.set('toDate', filters.toDate);
        if (filters.minAmount !== undefined && filters.minAmount !== null) {
            params = params.set('minAmount', filters.minAmount.toString());
        }
        if (filters.maxAmount !== undefined && filters.maxAmount !== null) {
            params = params.set('maxAmount', filters.maxAmount.toString());
        }
        if (filters.sortBy) params = params.set('sortBy', filters.sortBy);

        return params;
    }

    getTransactionById(id: string): Observable<Transaction> {
        return this.http.get<Transaction>(`${this.apiUrl}/get-transaction/${id}`);
    }

    createTransaction(req: CreateTransactionRequest): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/create-transaction`, req).pipe(
            tap(() => this.totalCount.update((n) => n + 1)),
        );
    }

    updateTransaction(req: UpdateTransactionRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/update-transaction/${req.id}`, req);
    }

    deleteTransaction(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete-transaction/${id}`).pipe(
            tap(() => this.totalCount.update((n) => Math.max(0, n - 1))),
        );
    }

    getTransactionEvents(transactionId: string): Observable<TransactionEvent[]> {
        return this.http.get<TransactionEvent[]>(`${this.apiUrl}/get-transaction-events/${transactionId}`);
    }
}
