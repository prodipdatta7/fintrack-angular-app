import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { Transaction } from '../../../core/models/transaction.model';
import { TransactionHistoryDrawerComponent } from '../transaction-history-drawer/transaction-history-drawer.component';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TransactionHistoryDrawerComponent
  ],
  template: `
    <div class="page-header">
      <div>
        <h2>Money <span class="glow-text-cyan">Transactions</span></h2>
        <p>Record, manage, and view audit event sourcing streams</p>
      </div>
      <a routerLink="/transactions/new" class="btn-primary">
        <i class="pi pi-plus"></i> Record Transaction
      </a>
    </div>

    <div class="table-container glass-card">
      @if (transactionService.isLoading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner glow-text-indigo" style="font-size: 2rem;"></i>
          <span>Loading transactions...</span>
        </div>
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th>Title / Note</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
              <th class="text-right">Actions & Event History</th>
            </tr>
          </thead>
          <tbody>
            @for (tx of transactionService.transactions(); track tx.id) {
              <tr>
                <td class="font-semibold">
                  <a [routerLink]="['/transactions/details', tx.id]" class="tx-title-link" title="View details">
                    {{ tx.title }}
                  </a>
                </td>
                <td>
                  <span class="category-pill">{{ getCategoryName(tx.categoryId) }}</span>
                </td>
                <td>
                  <span class="type-badge" [class.income]="tx.type === 0" [class.expense]="tx.type === 1">
                    {{ tx.type === 0 ? 'Income' : 'Expense' }}
                  </span>
                </td>
                <td class="amount-cell" [class.income-val]="tx.type === 0" [class.expense-val]="tx.type === 1">
                  {{ tx.type === 0 ? '+' : '-' }}{{ tx.amount | currency:'USD' }}
                </td>
                <td>{{ tx.date | date:'shortDate' }}</td>
                <td class="text-right actions-cell">
                  <a [routerLink]="['/transactions/details', tx.id]" class="action-btn view-btn" title="View Details">
                    <i class="pi pi-eye"></i>
                  </a>
                  <button (click)="openHistoryDrawer(tx.id)" class="action-btn history-btn" title="View Event History Audit Stream">
                    <i class="pi pi-history glow-text-cyan"></i> History
                  </button>
                  <a [routerLink]="['/transactions/edit', tx.id]" class="action-btn edit-btn" title="Edit Transaction">
                    <i class="pi pi-pencil"></i>
                  </a>
                  <button (click)="deleteTransaction(tx.id)" class="action-btn delete-btn" title="Delete Transaction">
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="empty-cell">
                  <i class="pi pi-receipt" style="font-size: 2.5rem; color: #64748b;"></i>
                  <p>No transactions found. Click "Record Transaction" to add your first entry.</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    <!-- Audit Event History Drawer -->
    <app-transaction-history-drawer
      [(visible)]="showHistoryDrawer"
      [transactionId]="historyTransactionId">
    </app-transaction-history-drawer>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.75rem;
    }
    .page-header h2 {
      font-size: 1.8rem;
    }
    .page-header p {
      color: #94a3b8;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }
    .table-container {
      width: 100%;
      overflow-x: auto;
      padding: 0.5rem;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th, .data-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .data-table th {
      color: #94a3b8;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .font-semibold {
      font-weight: 600;
    }
    .category-pill {
      background: rgba(255, 255, 255, 0.08);
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
      font-size: 0.8rem;
      color: #cbd5e1;
    }
    .type-badge {
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-weight: 600;
    }
    .type-badge.income { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .type-badge.expense { background: rgba(244, 63, 94, 0.15); color: #f43f5e; }
    
    .amount-cell {
      font-weight: 700;
      font-size: 1.05rem;
    }
    .amount-cell.income-val { color: #10b981; }
    .amount-cell.expense-val { color: #f43f5e; }

    .text-right { text-align: right; }
    .actions-cell {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .action-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      border-radius: 8px;
      padding: 0.4rem 0.75rem;
      cursor: pointer;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }
    .tx-title-link {
      color: #f8fafc;
      text-decoration: none;
      transition: color 0.2s ease;
    }
    .tx-title-link:hover {
      color: #38bdf8;
      text-decoration: underline;
    }
    .view-btn {
      border-color: rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
    }
    .view-btn:hover {
      background: rgba(99, 102, 241, 0.2);
      color: #fff;
    }
    .history-btn {
      border-color: rgba(6, 182, 212, 0.3);
      color: #38bdf8;
    }
    .delete-btn:hover {
      background: rgba(244, 63, 94, 0.2);
      color: #f43f5e;
      border-color: rgba(244, 63, 94, 0.4);
    }
    .empty-cell, .loading-state {
      text-align: center;
      padding: 3rem;
      color: #94a3b8;
    }
  `]
})
export class TransactionListComponent implements OnInit {
  readonly transactionService = inject(TransactionService);
  readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  showHistoryDrawer = false;
  historyTransactionId: string | null = null;

  ngOnInit(): void {
    this.categoryService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.transactionService.getTransactions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  getCategoryName(catId: string): string {
    const cat = this.categoryService.categories().find(c => c.id === catId);
    return cat ? cat.name : 'General';
  }

  openHistoryDrawer(txId: string): void {
    this.historyTransactionId = txId;
    this.showHistoryDrawer = true;
  }

  deleteTransaction(id: string): void {
    if (confirm('Are you sure you want to delete this transaction? A TransactionDeleted event will be recorded.')) {
      this.transactionService.deleteTransaction(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }
}
