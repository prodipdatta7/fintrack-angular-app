import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryType } from '../../../core/models/category.model';
import { Transaction } from '../../../core/models/transaction.model';
import { TransactionHistoryDrawerComponent } from '../transaction-history-drawer/transaction-history-drawer.component';

@Component({
    selector: 'app-transaction-list',
    standalone: true,
    imports: [
        DatePipe,
        CurrencyPipe,
        FormsModule,
        RouterLink,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatMenuModule,
        MatDividerModule,
        TransactionHistoryDrawerComponent,
    ],
    templateUrl: './transaction-list.component.html',
    styleUrl: './transaction-list.component.scss',
})
export class TransactionListComponent implements OnInit {
    readonly transactionService = inject(TransactionService);
    readonly categoryService = inject(CategoryService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    CategoryType = CategoryType;

    displayedColumns = ['title', 'category', 'type', 'amount', 'date', 'actions'];

    showHistoryDrawer = false;
    historyTransactionId: string | null = null;

    searchText = signal('');
    selectedCategoryId = signal<string | undefined>(undefined);
    typeFilter = signal<number | undefined>(undefined);
    rowsPerPage = signal(10);

    categoryOptions = computed(() =>
        this.categoryService.categories().map((c) => ({
            label: c.name,
            value: c.id,
        })),
    );

    typeOptions = [
        { label: 'Income', value: CategoryType.Income },
        { label: 'Expense', value: CategoryType.Expense },
    ];

    filteredTransactions = computed(() => this.transactionService.transactions());

    ngOnInit(): void {
        this.categoryService.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

        this.loadTransactions(1);
    }

    getCategoryName(catId: string): string {
        const cat = this.categoryService.categories().find((c) => c.id === catId);
        return cat ? cat.name : 'General';
    }

    openHistoryDrawer(txId: string): void {
        this.historyTransactionId = txId;
        this.showHistoryDrawer = true;
    }

    openDetails(txId: string): void {
        this.router.navigate(['/transactions/details', txId]);
    }

    deleteTransaction(id: string): void {
        if (
            window.confirm(
                'Are you sure you want to delete this transaction? A TransactionDeleted event will be recorded.',
            )
        ) {
            this.transactionService
                .deleteTransaction(id)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.loadTransactions(1);
                    },
                });
        }
    }

    onSearchTextChange(value: string): void {
        this.searchText.set(value);
        this.loadTransactions(1);
    }

    onCategoryChange(value: string | undefined): void {
        this.selectedCategoryId.set(value);
        this.loadTransactions(1);
    }

    onTypeChange(value: number | undefined): void {
        this.typeFilter.set(value);
        this.loadTransactions(1);
    }

    onPageChange(event: any): void {
        const page = event.pageIndex + 1;
        this.rowsPerPage.set(event.pageSize);
        this.loadTransactions(page);
    }

    private loadTransactions(page: number): void {
        this.transactionService
            .getTransactions(page, this.rowsPerPage(), this.selectedCategoryId(), this.typeFilter(), this.searchText())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                error: (err) => console.error('Failed to load transactions:', err),
            });
    }
}
