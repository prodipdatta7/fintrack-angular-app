import { Component, computed, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { Account } from '../../../../../core/models/account.model';
import { Category, CategoryType } from '../../../../../core/models/category.model';
import { Transaction } from '../../../../../core/models/transaction.model';
import { Timeframe } from '../../../../../core/models/dashboard.model';
import { SignedCurrencyPipe } from '../../../../../shared/pipes/signed-currency.pipe';
import {
    CustomDateRange,
    TimeframeSelectorComponent,
} from '../../../../../shared/components/timeframe-selector/timeframe-selector.component';
import { timeframeToDateRange } from '../../../../../shared/utils/date-range';

@Component({
    selector: 'app-recent-activity',
    standalone: true,
    imports: [DatePipe, RouterLink, SignedCurrencyPipe, TimeframeSelectorComponent],
    templateUrl: './recent-activity.component.html',
    styleUrl: './recent-activity.component.scss',
})
export class RecentActivityComponent {
    readonly transactions = input.required<Transaction[]>();
    readonly categories = input.required<Category[]>();
    readonly accounts = input.required<Account[]>();
    readonly isLoading = input(false);
    readonly showTimeframeSwitch = input(true);
    readonly timeframes = input<Timeframe[]>(['7D', '15D', '30D', 'This Month', '6M', 'This Year']);
    readonly activeTimeframe = input<Timeframe>('This Month');
    readonly customRange = signal<CustomDateRange | null>(null);

    readonly timeframeChange = output<Timeframe>();
    readonly customRangeChange = output<CustomDateRange>();

    readonly CategoryType = CategoryType;
    readonly MAX_ITEMS = 5;
    private readonly router = inject(Router);

    readonly rows = computed(() => {
        const categoryById = new Map(this.categories().map((category) => [category.id, category]));
        const accountById = new Map(this.accounts().map((account) => [account.id, account]));
        const tf = this.activeTimeframe();
        const custom = this.customRange();
        const range = timeframeToDateRange(tf, custom ? { from: custom.from, to: custom.to } : undefined);

        return this.transactions()
            .filter((tx) => {
                if (!range.from && !range.to) return true;
                const d = new Date(tx.date).getTime();
                if (range.from && d < new Date(range.from).getTime()) return false;
                if (range.to && d > new Date(range.to).getTime()) return false;
                return true;
            })
            .map((transaction) => ({
                transaction,
                category: categoryById.get(transaction.categoryId),
                account: accountById.get(transaction.accountId),
                isIncome: transaction.type === CategoryType.Income,
            }));
    });

    /** Show only 5 items in the recent ledger widget */
    readonly visibleRows = computed(() => this.rows().slice(0, this.MAX_ITEMS));

    /** Check if there are additional transactions beyond the 5 limit */
    readonly hasMore = computed(() => this.rows().length > this.MAX_ITEMS);

    /** Count of remaining transactions */
    readonly remainingCount = computed(() => Math.max(0, this.rows().length - this.MAX_ITEMS));

    onTimeframeChange(tf: Timeframe): void {
        this.customRange.set(null);
        this.timeframeChange.emit(tf);
    }

    onCustomRange(range: CustomDateRange): void {
        this.customRange.set(range);
        this.customRangeChange.emit(range);
    }

    openTransaction(id: string): void {
        this.router.navigate(['/transactions/details', id]);
    }
}
