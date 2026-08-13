import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { Account } from '../../../../../core/models/account.model';
import { Category, CategoryType } from '../../../../../core/models/category.model';
import { Transaction } from '../../../../../core/models/transaction.model';
import { SignedCurrencyPipe } from '../../../../../shared/pipes/signed-currency.pipe';

@Component({
    selector: 'app-recent-activity',
    standalone: true,
    imports: [DatePipe, RouterLink, SignedCurrencyPipe],
    templateUrl: './recent-activity.component.html',
    styleUrl: './recent-activity.component.scss',
})
export class RecentActivityComponent {
    readonly transactions = input.required<Transaction[]>();
    readonly categories = input.required<Category[]>();
    readonly accounts = input.required<Account[]>();
    readonly isLoading = input(false);

    readonly CategoryType = CategoryType;
    private readonly router = inject(Router);

    readonly rows = computed(() => {
        const categoryById = new Map(this.categories().map((category) => [category.id, category]));
        const accountById = new Map(this.accounts().map((account) => [account.id, account]));

        return this.transactions().map((transaction) => ({
            transaction,
            category: categoryById.get(transaction.categoryId),
            account: accountById.get(transaction.accountId),
            isIncome: transaction.type === CategoryType.Income,
        }));
    });

    openTransaction(id: string): void {
        this.router.navigate(['/transactions/details', id]);
    }
}
