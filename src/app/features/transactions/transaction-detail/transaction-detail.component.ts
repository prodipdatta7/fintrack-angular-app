import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe, Location } from '@angular/common';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Transaction, TransactionAttachment } from '../../../core/models/transaction.model';
import { TransactionEvent } from '../../../core/models/transaction-event.model';
import { Category, CategoryType } from '../../../core/models/category.model';
import { Account } from '../../../core/models/account.model';
import { FileViewerComponent } from '../../../shared/components/file-viewer/file-viewer.component';
import { SignedCurrencyPipe } from '../../../shared/pipes/signed-currency.pipe';
import { AuditTimelineComponent } from '../components/audit-timeline/audit-timeline.component';

@Component({
    selector: 'app-transaction-detail',
    standalone: true,
    imports: [AppCurrencyPipe, DatePipe, RouterLink, FileViewerComponent, SignedCurrencyPipe, AuditTimelineComponent],
    templateUrl: './transaction-detail.component.html',
    styleUrl: './transaction-detail.component.scss',
})
export class TransactionDetailComponent implements OnInit {
    private readonly transactionService = inject(TransactionService);
    private readonly categoryService = inject(CategoryService);
    private readonly accountService = inject(AccountService);
    private readonly confirmDialog = inject(ConfirmDialogService);
    private readonly toast = inject(ToastService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly location = inject(Location);
    private readonly destroyRef = inject(DestroyRef);

    readonly CategoryType = CategoryType;

    readonly transaction = signal<Transaction | null>(null);
    readonly category = signal<Category | null>(null);
    readonly account = signal<Account | null>(null);
    readonly events = signal<TransactionEvent[]>([]);

    readonly isLoading = signal(true);
    readonly isLoadingEvents = signal(false);

    showFileViewer = false;
    selectedFile: TransactionAttachment | null = null;

    get isIncome(): boolean {
        return this.transaction()?.type === CategoryType.Income;
    }

    get attachmentsList(): TransactionAttachment[] {
        const transaction = this.transaction();
        if (!transaction) return [];
        if (transaction.attachments && transaction.attachments.length > 0) {
            return transaction.attachments;
        }
        if (transaction.receiptFileName || transaction.receiptUrl) {
            return [
                {
                    fileName: transaction.receiptFileName || 'Attached Document',
                    fileUrl: transaction.receiptUrl || '',
                },
            ];
        }
        return [];
    }

    get tagsList(): string[] {
        const tags = this.transaction()?.tags;
        if (!tags) return [];
        return tags
            .split(',')
            .map((tag) => tag.trim().replace(/^#/, ''))
            .filter(Boolean);
    }

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
            const id = params.get('id');
            if (id) {
                this.loadTransaction(id);
                this.loadEvents(id);
            } else {
                this.isLoading.set(false);
            }
        });
    }

    goBack(): void {
        this.location.back();
    }

    deleteTransaction(): void {
        const transaction = this.transaction();
        if (!transaction) return;

        this.confirmDialog
            .confirmDelete(
                `"${transaction.title}" will be removed. A TransactionDeleted event will be recorded.`,
                'Delete record',
            )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((confirmed) => {
                if (!confirmed) return;
                this.transactionService
                    .deleteTransaction(transaction.id)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => {
                            this.toast.show('Transaction removed');
                            this.accountService.getAccounts().subscribe({ error: () => undefined });
                            this.router.navigate(['/transactions']);
                        },
                        error: () => this.toast.error('Could not delete the transaction'),
                    });
            });
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
        const lowered = (name || '').toLowerCase();
        if (/\.(jpg|jpeg|jpe|png|gif|webp|svg)$/.test(lowered)) return 'image';
        if (/\.pdf$/.test(lowered)) return 'picture_as_pdf';
        return 'description';
    }

    formatTime(timeStr?: string): string {
        if (!timeStr) return 'Not specified';
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;

        const hours = parseInt(parts[0], 10);
        if (isNaN(hours)) return timeStr;
        const suffix = hours >= 12 ? 'PM' : 'AM';
        return `${hours % 12 || 12}:${parts[1]} ${suffix}`;
    }

    private loadTransaction(id: string): void {
        this.isLoading.set(true);
        const cached = this.transactionService.transactions().find((item) => item.id === id);
        if (cached) {
            this.transaction.set(cached);
            this.resolveRelations(cached);
            this.isLoading.set(false);
        }

        this.transactionService
            .getTransactionById(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (transaction) => {
                    this.transaction.set(transaction);
                    this.resolveRelations(transaction);
                    this.isLoading.set(false);
                },
                error: () => this.isLoading.set(false),
            });
    }

    private loadEvents(id: string): void {
        this.isLoadingEvents.set(true);
        this.transactionService
            .getTransactionEvents(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (events) => {
                    this.events.set(events);
                    this.isLoadingEvents.set(false);
                },
                error: () => {
                    this.events.set([]);
                    this.isLoadingEvents.set(false);
                },
            });
    }

    private resolveRelations(transaction: Transaction): void {
        const cachedCategory = this.categoryService.categories().find((item) => item.id === transaction.categoryId);
        if (cachedCategory) this.category.set(cachedCategory);

        if (transaction.categoryId) {
            this.categoryService
                .getCategoryById(transaction.categoryId)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({ next: (category) => category && this.category.set(category), error: () => {} });
        }

        if (transaction.accountId) {
            this.accountService
                .getAccountById(transaction.accountId)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({ next: (account) => this.account.set(account), error: () => {} });
        }
    }
}
