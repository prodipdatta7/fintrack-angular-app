import { Component, DestroyRef, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionEvent } from '../../../core/models/transaction-event.model';

@Component({
    selector: 'app-transaction-history-drawer',
    standalone: true,
    imports: [DatePipe, MatProgressSpinnerModule],
    templateUrl: './transaction-history-drawer.component.html',
    styleUrl: './transaction-history-drawer.component.scss',
})
export class TransactionHistoryDrawerComponent implements OnChanges {
    @Input() visible = false;
    @Input() transactionId: string | null = null;
    @Output() visibleChange = new EventEmitter<boolean>();

    private readonly transactionService = inject(TransactionService);
    private readonly destroyRef = inject(DestroyRef);

    events: TransactionEvent[] = [];
    isLoading = false;

    ngOnChanges(changes: SimpleChanges): void {
        const txnChanged = changes['transactionId'] && this.transactionId;
        const becameVisible = changes['visible'] && changes['visible'].currentValue === true;
        if ((txnChanged || becameVisible) && this.transactionId && this.visible) {
            this.loadEvents();
        }
    }

    loadEvents(): void {
        if (!this.transactionId) return;
        this.isLoading = true;
        this.events = [];
        this.transactionService
            .getTransactionEvents(this.transactionId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    this.events = data;
                    this.isLoading = false;
                },
                error: () => {
                    this.events = [];
                    this.isLoading = false;
                },
            });
    }

    close(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    getEventTypeClass(type: string): string {
        if (type.includes('Created')) return 'created';
        if (type.includes('Updated')) return 'updated';
        if (type.includes('Deleted')) return 'deleted';
        return 'updated';
    }

    getEventSeverity(type: string): 'success' | 'info' | 'danger' | 'secondary' {
        if (type.includes('Created')) return 'success';
        if (type.includes('Updated')) return 'info';
        if (type.includes('Deleted')) return 'danger';
        return 'secondary';
    }

    getEventTypeIcon(type: string): string {
        if (type.includes('Created')) return 'add_circle';
        if (type.includes('Updated')) return 'edit';
        if (type.includes('Deleted')) return 'delete';
        return 'info';
    }

    formatJson(jsonStr: string): string {
        try {
            return JSON.stringify(JSON.parse(jsonStr), null, 2);
        } catch {
            return jsonStr;
        }
    }
}
