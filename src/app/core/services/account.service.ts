import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, finalize, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Account, AccountListResult, CreateAccountRequest, UpdateAccountRequest } from '../models/account.model';

@Injectable({
    providedIn: 'root',
})
export class AccountService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    accounts = signal<Account[]>([]);
    isLoading = signal<boolean>(false);

    totalBalance = computed(() =>
        this.accounts()
            .filter((account) => !account.isClosed)
            .reduce((sum, account) => sum + Number(account.balance), 0),
    );

    getAccounts(includeClosed = false): Observable<AccountListResult> {
        this.isLoading.set(true);
        const params = includeClosed ? new HttpParams().set('includeClosed', true) : undefined;
        return this.http.get<AccountListResult>(`${this.apiUrl}/get-accounts`, { params }).pipe(
            tap((res: AccountListResult) => this.accounts.set(res.items ?? [])),
            finalize(() => this.isLoading.set(false)),
        );
    }

    getAccountById(id: string): Observable<Account> {
        return this.http.get<Account>(`${this.apiUrl}/get-account/${id}`);
    }

    createAccount(req: CreateAccountRequest): Observable<string> {
        return this.http
            .post<{ accountId: string }>(`${this.apiUrl}/create-account`, req)
            .pipe(map((res) => res.accountId));
    }

    updateAccount(req: UpdateAccountRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/update-account/${req.id}`, req);
    }

    /** Inline balance adjustment — patches the local signal so totals refresh without a refetch. */
    updateBalance(id: string, balance: number): Observable<void> {
        return this.http
            .patch<void>(`${this.apiUrl}/update-account-balance/${id}`, { balance })
            .pipe(tap(() => this.patchBalance(id, balance)));
    }

    /** Close or reopen an account. Accounts are never hard-deleted — transactions reference them. */
    setAccountStatus(id: string, isClosed: boolean): Observable<void> {
        return this.http
            .patch<void>(`${this.apiUrl}/update-account-status/${id}`, { isClosed })
            .pipe(tap(() => this.patchStatus(id, isClosed)));
    }

    /** Share of the total portfolio held by one account, as a whole percentage. */
    portfolioShare(accountId: string): number {
        const total = this.totalBalance();
        if (total <= 0) return 0;
        const account = this.accounts().find((item) => item.id === accountId);
        if (!account || account.isClosed) return 0;
        return Math.round((Number(account.balance) / total) * 100);
    }

    private patchBalance(id: string, balance: number): void {
        this.accounts.update((list) => list.map((account) => (account.id === id ? { ...account, balance } : account)));
    }

    private patchStatus(id: string, isClosed: boolean): void {
        this.accounts.update((list) => list.map((account) => (account.id === id ? { ...account, isClosed } : account)));
    }
}
