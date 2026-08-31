import { Component, computed, inject, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Transaction } from '../../../../../core/models/transaction.model';
import { Category, CategoryType } from '../../../../../core/models/category.model';
import { Account } from '../../../../../core/models/account.model';
import { Timeframe } from '../../../../../core/models/dashboard.model';
import { SignedCurrencyPipe } from '../../../../../shared/pipes/signed-currency.pipe';
import { formatTimeframeLabel, timeframeToDateRange } from '../../../../../shared/utils/date-range';

export interface MobileTopExpenseRow {
    transaction: Transaction;
    category?: Category;
    account?: Account;
}

@Component({
    selector: 'app-mobile-top-expenses',
    standalone: true,
    imports: [CommonModule, RouterLink, DatePipe, SignedCurrencyPipe],
    templateUrl: './mobile-top-expenses.component.html',
    styleUrl: './mobile-top-expenses.component.scss',
})
export class MobileTopExpensesComponent {
    readonly transactions = input.required<Transaction[]>();
    readonly categories = input.required<Category[]>();
    readonly accounts = input.required<Account[]>();
    readonly activeTimeframe = input<Timeframe>('This Month');
    readonly isLoading = input<boolean>(false);

    private readonly router = inject(Router);

    readonly MAX_ITEMS = 5;
    readonly activeLabel = computed(() => formatTimeframeLabel(this.activeTimeframe()));

    /** Filters for expense transactions in the active timeframe and takes top 5 highest amounts */
    readonly topExpenses = computed<MobileTopExpenseRow[]>(() => {
        const categoryMap = new Map(this.categories().map((c) => [c.id, c]));
        const accountMap = new Map(this.accounts().map((a) => [a.id, a]));
        const range = timeframeToDateRange(this.activeTimeframe());

        return this.transactions()
            .filter((tx) => tx.type === CategoryType.Expense)
            .filter((tx) => {
                if (!range.from && !range.to) return true;
                const d = new Date(tx.date).getTime();
                if (range.from && d < new Date(range.from).getTime()) return false;
                if (range.to && d > new Date(range.to).getTime()) return false;
                return true;
            })
            .sort((a, b) => b.amount - a.amount)
            .slice(0, this.MAX_ITEMS)
            .map((tx) => ({
                transaction: tx,
                category: categoryMap.get(tx.categoryId),
                account: accountMap.get(tx.accountId),
            }));
    });

    readonly hasExpenses = computed(() => this.topExpenses().length > 0);

    openTransaction(id: string): void {
        this.router.navigate(['/transactions/details', id]);
    }
}
