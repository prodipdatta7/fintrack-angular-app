import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateTransactionRequest, Transaction, TransactionPagedResult, UpdateTransactionRequest } from '../models/transaction.model';
import { TransactionEvent } from '../models/transaction-event.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/transactions`;

  transactions = signal<Transaction[]>([]);
  totalCount = signal<number>(0);
  isLoading = signal<boolean>(false);

  getTransactions(page = 1, pageSize = 10, categoryId?: string, type?: number): Observable<TransactionPagedResult> {
    this.isLoading.set(true);
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (categoryId) params = params.set('categoryId', categoryId);
    if (type !== undefined && type !== null) params = params.set('type', type.toString());

    return this.http.get<TransactionPagedResult>(this.apiUrl, { params }).pipe(
      tap((res: TransactionPagedResult) => {
        this.transactions.set(res.items);
        this.totalCount.set(res.totalCount);
        this.isLoading.set(false);
      })
    );
  }

  getTransactionById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }

  createTransaction(req: CreateTransactionRequest): Observable<string> {
    return this.http.post<string>(this.apiUrl, req).pipe(
      tap(() => this.getTransactions().subscribe())
    );
  }

  updateTransaction(req: UpdateTransactionRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${req.id}`, req).pipe(
      tap(() => this.getTransactions().subscribe())
    );
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.getTransactions().subscribe())
    );
  }

  // Event Sourcing API method
  getTransactionEvents(transactionId: string): Observable<TransactionEvent[]> {
    return this.http.get<TransactionEvent[]>(`${this.apiUrl}/${transactionId}/events`);
  }
}
