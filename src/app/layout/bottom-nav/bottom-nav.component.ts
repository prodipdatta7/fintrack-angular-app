import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AccountService } from '../../core/services/account.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';

@Component({
    selector: 'app-bottom-nav',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './bottom-nav.component.html',
    styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
    private readonly accountService = inject(AccountService);
    private readonly categoryService = inject(CategoryService);
    private readonly transactionService = inject(TransactionService);

    readonly accountCount = computed(() => this.accountService.accounts().filter((a) => !a.isClosed).length);
    readonly transactionCount = computed(() => this.transactionService.totalCount());
    readonly categoryCount = computed(() => this.categoryService.categories().length);
}
