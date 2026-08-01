import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { Transaction, TransactionAttachment } from '../../../core/models/transaction.model';
import { CategoryType } from '../../../core/models/category.model';
import { TransactionHistoryDrawerComponent } from '../transaction-history-drawer/transaction-history-drawer.component';
import { FileViewerComponent } from '../../../shared/components/file-viewer/file-viewer.component';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatProgressSpinnerModule, MatIconModule, TransactionHistoryDrawerComponent, FileViewerComponent],
  templateUrl: './transaction-detail.component.html',
  styleUrl: './transaction-detail.component.scss'
})
export class TransactionDetailComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  CategoryType = CategoryType;
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
    if (/\.(jpg|jpeg|jpe|png|gif|webp|svg)$/.test(n)) return 'image';
    if (/\.pdf$/.test(n)) return 'picture_as_pdf';
    if (/\.(docx|doc)$/.test(n)) return 'description';
    return 'description';
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
