import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { Transaction, TransactionAttachment } from '../../../core/models/transaction.model';
import { Category } from '../../../core/models/category.model';
import { TransactionHistoryDrawerComponent } from '../transaction-history-drawer/transaction-history-drawer.component';
import { FileViewerComponent } from '../../../shared/components/file-viewer/file-viewer.component';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TransactionHistoryDrawerComponent, FileViewerComponent],
  template: `
    <div class="detail-page">
      <!-- Header Actions -->
      <div class="detail-header">
        <a routerLink="/transactions" class="back-link">
          <i class="pi pi-arrow-left"></i> Back to Transactions
        </a>
        <div class="header-actions">
          <button (click)="openHistoryDrawer()" class="btn-history" title="View Audit Trail">
            <i class="pi pi-history"></i> Audit Trail
          </button>
          @if (transaction) {
            <a [routerLink]="['/transactions/edit', transaction.id]" class="btn-edit">
              <i class="pi pi-pencil"></i> Edit Transaction
            </a>
          }
        </div>
      </div>

      @if (isLoading) {
        <div class="loading-state glass-card">
          <i class="pi pi-spin pi-spinner spinner-icon"></i>
          <span>Loading transaction details...</span>
        </div>
      } @else if (transaction) {
        <div class="detail-content glass-card">
          <!-- Main Header & Amount Badge -->
          <div class="card-hero">
            <div class="hero-main">
              <span class="type-pill" [class.income]="transaction.type === 0" [class.expense]="transaction.type === 1">
                {{ transaction.type === 0 ? '🟢 Income' : '🔴 Expense' }}
              </span>
              <h2 class="tx-title">{{ transaction.title }}</h2>
              <span class="tx-date"><i class="pi pi-calendar"></i> {{ formatDate(transaction.date) }} {{ transaction.time ? 'at ' + formatTime(transaction.time) : '' }}</span>
            </div>
            <div class="hero-amount" [class.income-text]="transaction.type === 0" [class.expense-text]="transaction.type === 1">
              {{ transaction.type === 0 ? '+' : '-' }}\${{ transaction.amount.toFixed(2) }}
            </div>
          </div>

          <div class="divider"></div>

          <!-- Key Details Grid -->
          <div class="details-grid">
            <div class="info-item">
              <label>Category</label>
              <div class="info-value">
                <i class="pi pi-tag icon"></i>
                <span>{{ categoryName }}</span>
              </div>
            </div>

            <div class="info-item">
              <label>Payment Method</label>
              <div class="info-value">
                <i class="pi pi-credit-card icon"></i>
                <span>{{ transaction.paymentMethod || 'Cash 💵' }}</span>
              </div>
            </div>

            <div class="info-item">
              <label>Transaction ID</label>
              <div class="info-value code-font">
                <span>{{ transaction.id }}</span>
              </div>
            </div>

            <div class="info-item">
              <label>Record Created At</label>
              <div class="info-value">
                <i class="pi pi-clock icon"></i>
                <span>{{ formatDate(transaction.createdAt || transaction.date) }} {{ transaction.time ? 'at ' + formatTime(transaction.time) : '' }}</span>
              </div>
            </div>
          </div>

          <!-- Tags Section -->
          <div class="section-box">
            <label class="section-label">Tags / Labels</label>
            @if (tagsList.length > 0) {
              <div class="tags-chips-list">
                @for (tag of tagsList; track tag) {
                  <span class="tag-chip">#{{ tag }}</span>
                }
              </div>
            } @else {
              <div class="empty-placeholder">
                <i class="pi pi-tags icon"></i>
                <span>No tags attached to this transaction</span>
              </div>
            }
          </div>

          <!-- Receipt / Transcript Attachment Section -->
          <div class="section-box">
            <label class="section-label">Attached Transcripts & Documents ({{ attachmentsList.length }})</label>
            @if (attachmentsList.length > 0) {
              <div class="attachments-grid">
                @for (file of attachmentsList; track $index) {
                  <div class="attachment-card clickable" (click)="openFileViewer(file)" title="Click to view file in full-screen viewer">
                    <i [class]="getAttachmentIcon(file.fileName)" class="attachment-icon"></i>
                    <div class="attachment-info">
                      <span class="file-name">{{ file.fileName }}</span>
                      <span class="file-status">Click to open full file viewer</span>
                    </div>
                    <button type="button" class="btn-download" (click)="$event.stopPropagation(); openFileViewer(file)">
                      <i class="pi pi-eye"></i> View File
                    </button>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-placeholder">
                <i class="pi pi-file icon"></i>
                <span>No transcript or receipt document attached</span>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="empty-state glass-card">
          <i class="pi pi-exclamation-circle icon"></i>
          <h3>Transaction Not Found</h3>
          <p>The requested transaction ID could not be located.</p>
          <a routerLink="/transactions" class="btn-primary">Return to Transactions List</a>
        </div>
      }
    </div>

    <!-- Event History Drawer -->
    <app-transaction-history-drawer
      [visible]="showHistoryDrawer"
      [transactionId]="historyTransactionId"
      (visibleChange)="showHistoryDrawer = $event">
    </app-transaction-history-drawer>

    <!-- File Viewer Modal -->
    <app-file-viewer
      [visible]="showFileViewer"
      [fileUrl]="selectedFile?.fileUrl || null"
      [fileName]="selectedFile?.fileName || null"
      (visibleChange)="showFileViewer = $event">
    </app-file-viewer>
  `,
  styles: [`
    .detail-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem 0;
    }
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: #38bdf8;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    .back-link:hover { color: #7dd3fc; }
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
    .btn-history {
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.4);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }
    .btn-history:hover {
      background: rgba(99, 102, 241, 0.4);
      color: #fff;
    }
    .btn-edit {
      background: linear-gradient(135deg, var(--primary-accent), var(--cyan-accent));
      color: #fff;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      box-shadow: 0 4px 16px var(--primary-glow);
      transition: transform 0.2s ease;
    }
    .btn-edit:hover { transform: translateY(-2px); }

    .detail-content {
      padding: 2rem;
    }
    .card-hero {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
    }
    .type-pill {
      display: inline-block;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
      margin-bottom: 0.6rem;
    }
    .type-pill.income {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .type-pill.expense {
      background: rgba(244, 63, 94, 0.15);
      color: #fb7185;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }
    .tx-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 0.4rem;
    }
    .tx-date {
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .hero-amount {
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .income-text {
      color: #34d399;
      text-shadow: 0 0 20px rgba(52, 211, 153, 0.3);
    }
    .expense-text {
      color: #fb7185;
      text-shadow: 0 0 20px rgba(251, 113, 133, 0.3);
    }

    .divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 1.5rem 0;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .info-item label {
      font-size: 0.8rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .info-value {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      color: #e2e8f0;
      font-weight: 500;
    }
    .info-value .icon {
      color: #38bdf8;
    }
    .code-font {
      font-family: monospace;
      font-size: 0.85rem;
      color: #94a3b8;
    }

    .section-box {
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .section-label {
      font-size: 0.8rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.6rem;
    }
    .tags-chips-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .tag-chip {
      background: rgba(6, 182, 212, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(6, 182, 212, 0.3);
      border-radius: 16px;
      padding: 0.3rem 0.75rem;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .attachment-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1rem;
    }
    .attachment-icon {
      font-size: 2rem;
      color: #fb7185;
    }
    .attachment-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .attachment-info .file-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: #f8fafc;
    }
    .attachment-info .file-status {
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .btn-download {
      background: rgba(99, 102, 241, 0.2);
      color: #38bdf8;
      text-decoration: none;
      border: 1px solid rgba(6, 182, 212, 0.4);
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }
    .btn-download:hover {
      background: rgba(6, 182, 212, 0.3);
      color: #fff;
    }

    .empty-placeholder {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(15, 23, 42, 0.4);
      border: 1px dashed rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #64748b;
      font-size: 0.85rem;
    }
    .empty-placeholder .icon {
      font-size: 1.1rem;
      color: #475569;
    }

    .loading-state, .empty-state {
      padding: 3rem;
      text-align: center;
    }
    .spinner-icon {
      font-size: 2rem;
      color: #38bdf8;
      margin-bottom: 0.8rem;
    }
    .empty-state .icon {
      font-size: 3rem;
      color: #f43f5e;
      margin-bottom: 1rem;
    }
  `]
})
export class TransactionDetailComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  transaction: Transaction | null = null;
  categoryName = 'Uncategorized';
  isLoading = true;
  showHistoryDrawer = false;
  historyTransactionId: string | null = null;
  showFileViewer = false;
  selectedFile: TransactionAttachment | null = null;

  get attachmentsList(): TransactionAttachment[] {
    if (!this.transaction) return [];
    if (this.transaction.attachments && this.transaction.attachments.length > 0) {
      return this.transaction.attachments;
    }
    if (this.transaction.receiptFileName || this.transaction.receiptUrl) {
      return [{
        fileName: this.transaction.receiptFileName || 'Attached Document',
        fileUrl: this.transaction.receiptUrl || ''
      }];
    }
    return [];
  }

  get tagsList(): string[] {
    if (!this.transaction?.tags) return [];
    return this.transaction.tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.loadTransaction(id);
        } else {
          this.isLoading = false;
        }
      });
  }

  openHistoryDrawer(): void {
    if (this.transaction) {
      this.historyTransactionId = this.transaction.id;
      this.showHistoryDrawer = true;
    }
  }

  openFileViewer(file?: TransactionAttachment): void {
    if (file) {
      this.selectedFile = file;
    } else if (this.attachmentsList.length > 0) {
      this.selectedFile = this.attachmentsList[0];
    }
    if (this.selectedFile) {
      this.showFileViewer = true;
    }
  }

  getAttachmentIcon(name: string): string {
    const n = (name || '').toLowerCase();
    if (/\.(jpg|jpeg|jpe|png|gif|webp|svg)$/.test(n)) return 'pi pi-image';
    if (/\.pdf$/.test(n)) return 'pi pi-file-pdf';
    if (/\.(docx|doc)$/.test(n)) return 'pi pi-file-word';
    return 'pi pi-file';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  formatTime(timeStr?: string): string {
    if (!timeStr) return 'Not specified';
    try {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        if (isNaN(hours)) return timeStr;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        return `${formattedHours}:${minutes} ${ampm}`;
      }
      return timeStr;
    } catch {
      return timeStr || 'Not specified';
    }
  }

  private loadTransaction(id: string): void {
    this.isLoading = true;
    const existing = this.transactionService.transactions().find(t => t.id === id);
    if (existing) {
      this.transaction = existing;
      this.loadCategoryName();
      this.isLoading = false;
    }

    this.transactionService.getTransactionById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: tx => {
          this.transaction = tx;
          this.loadCategoryName();
          this.isLoading = false;
        },
        error: () => {
          if (!this.transaction) {
            this.transaction = null;
          }
          this.isLoading = false;
        }
      });
  }

  private loadCategoryName(): void {
    if (!this.transaction?.categoryId) return;
    const catId = this.transaction.categoryId;
    const existingCat = this.categoryService.categories().find(c => c.id === catId);
    if (existingCat) {
      this.categoryName = existingCat.name;
    }

    this.categoryService.getCategoryById(catId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: cat => {
          if (cat) this.categoryName = cat.name;
        },
        error: () => {
          if (!this.categoryName) {
            this.categoryName = 'Uncategorized';
          }
        }
      });
  }
}
