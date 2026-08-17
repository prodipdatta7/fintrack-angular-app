import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { SignedCurrencyPipe } from '../../../shared/pipes/signed-currency.pipe';
import { Category, CategoryType } from '../../../core/models/category.model';
import { Transaction } from '../../../core/models/transaction.model';
import { CategoryService } from '../../../core/services/category.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { TagService } from '../../../core/services/tag.service';
import { ToastService } from '../../../core/services/toast.service';
import { CategoryFormDialogComponent } from '../category-form-dialog/category-form-dialog.component';
import { CreateTagPayload, TagsPanelComponent } from '../tags-panel/tags-panel.component';

@Component({
    selector: 'app-category-detail',
    standalone: true,
    imports: [
        AppCurrencyPipe,
        SignedCurrencyPipe,
        DatePipe,
        FormsModule,
        RouterLink,
        CategoryFormDialogComponent,
        TagsPanelComponent,
    ],
    templateUrl: './category-detail.component.html',
    styleUrl: './category-detail.component.scss',
})
export class CategoryDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly categoryService = inject(CategoryService);
    private readonly dashboardService = inject(DashboardService);
    private readonly transactionService = inject(TransactionService);
    readonly tagService = inject(TagService);
    private readonly toast = inject(ToastService);
    private readonly destroyRef = inject(DestroyRef);

    readonly CategoryType = CategoryType;

    readonly categoryId = signal('');
    readonly category = signal<Category | null>(null);
    readonly notFound = signal(false);
    readonly isLoadingCategory = signal(true);
    readonly isLoadingLedger = signal(false);
    readonly isLoadingSummary = signal(false);

    readonly spent = signal(0);
    readonly transactions = signal<Transaction[]>([]);

    readonly tagInput = signal('');
    readonly isSavingTag = signal(false);

    showDialog = false;
    editingCategory: Category | null = null;

    readonly percent = computed(() => {
        const category = this.category();
        const limit = category?.budgetLimit ?? 0;
        return limit > 0 ? Math.min(Math.round((this.spent() / limit) * 100), 100) : 0;
    });

    readonly isOverBudget = computed(() => {
        const category = this.category();
        return !!category && category.budgetLimit > 0 && this.spent() > category.budgetLimit;
    });

    readonly remaining = computed(() => {
        const category = this.category();
        if (!category || category.budgetLimit <= 0) return 0;
        return Math.max(0, category.budgetLimit - this.spent());
    });

    readonly showBudget = computed(() => this.category()?.type === CategoryType.Expense);

    readonly assignedTags = computed(() => this.tagService.tagsForCategory(this.categoryId()));

    readonly availableTags = computed(() => {
        const assigned = this.assignedTags();
        return this.tagService
            .tags()
            .filter((tag) => !assigned.some((t) => t.toLowerCase() === tag.toLowerCase()))
            .sort((a, b) => a.localeCompare(b));
    });

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
            const id = params.get('id') ?? '';
            this.categoryId.set(id);
            this.loadCategory(id);
            this.loadSummary(id);
            this.loadLedger(id);
            this.loadTags(id);
        });
    }

    openTransaction(id: string): void {
        this.router.navigate(['/transactions/details', id]);
    }

    recordTransaction(): void {
        this.router.navigate(['/transactions/new'], { queryParams: { categoryId: this.categoryId() } });
    }

    openEdit(): void {
        this.editingCategory = this.category();
        this.showDialog = true;
    }

    onDialogClosed(): void {
        this.editingCategory = null;
        this.loadCategory(this.categoryId());
        this.loadSummary(this.categoryId());
    }

    onTagInputChange(value: string): void {
        this.tagInput.set(value);
    }

    createTag(): void {
        const raw = this.tagInput().trim().replace(/^#/, '');
        if (!raw) {
            this.toast.error('Enter a tag name first');
            return;
        }

        this.isSavingTag.set(true);
        this.tagService
            .createTagForCategory(raw, this.categoryId())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((added) => {
                this.isSavingTag.set(false);
                if (added) {
                    this.toast.show(`Tag "${added}" added under this category`);
                    this.tagInput.set('');
                } else {
                    this.toast.error('Could not create that tag');
                }
            });
    }

    assignTag(tag: string): void {
        this.tagService
            .assignTagToCategory(this.categoryId(), tag)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.toast.show(`Tag "#${tag}" assigned to this category`),
                error: () => this.toast.error('Could not assign that tag'),
            });
    }

    unassignTag(tag: string): void {
        this.tagService
            .unassignTagFromCategory(this.categoryId(), tag)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.toast.show(`Tag "#${tag}" unassigned from this category`),
                error: () => this.toast.error('Could not unassign that tag'),
            });
    }

    /** Bulk assignment of several global tags to this category in one action. */
    assignTags(tags: string[]): void {
        if (!tags.length) return;

        let completed = 0;
        for (const tag of tags) {
            this.tagService
                .assignTagToCategory(this.categoryId(), tag)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        completed += 1;
                        if (completed === tags.length) {
                            this.toast.show(
                                `${tags.length} tag${tags.length === 1 ? '' : 's'} assigned to this category`,
                            );
                        }
                    },
                    error: () => {
                        completed += 1;
                        if (completed === tags.length) {
                            this.toast.error('Could not assign one or more tags');
                        }
                    },
                });
        }
    }

    /** Creates a new tag, optionally binding it to this category immediately. */
    createTagFromPanel(payload: CreateTagPayload): void {
        this.isSavingTag.set(true);
        const request = payload.autoAssign
            ? this.tagService.createTagForCategory(payload.name, this.categoryId())
            : this.tagService.createTag(payload.name);
        request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (added) => {
                this.isSavingTag.set(false);
                if (added) {
                    this.toast.show(
                        payload.autoAssign
                            ? `Tag "#${added}" created and assigned to this category`
                            : `Tag "#${added}" created`,
                    );
                } else {
                    this.toast.error('Could not create that tag');
                }
            },
            error: () => {
                this.isSavingTag.set(false);
                this.toast.error('Could not create that tag');
            },
        });
    }

    private loadTags(id: string): void {
        this.tagService.loadTags().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        this.tagService.loadCategoryTags(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }

    private loadCategory(id: string): void {
        this.isLoadingCategory.set(true);
        this.notFound.set(false);

        const cached = this.categoryService.categories().find((item) => item.id === id);
        if (cached) {
            this.category.set(cached);
            this.isLoadingCategory.set(false);
        }

        this.categoryService
            .getCategoryById(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (category) => {
                    this.category.set(category);
                    this.isLoadingCategory.set(false);
                },
                error: () => {
                    if (!this.category()) {
                        this.notFound.set(true);
                    }
                    this.isLoadingCategory.set(false);
                },
            });
    }

    private loadSummary(id: string): void {
        this.isLoadingSummary.set(true);
        this.dashboardService
            .getSummary()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (summary) => {
                    this.spent.set(summary.categorySpent.find((entry) => entry.categoryId === id)?.spent ?? 0);
                    this.isLoadingSummary.set(false);
                },
                error: () => {
                    this.spent.set(0);
                    this.isLoadingSummary.set(false);
                },
            });
    }

    private loadLedger(id: string): void {
        this.isLoadingLedger.set(true);
        this.transactionService
            .queryTransactions(1, 25, id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.transactions.set(result.items);
                    this.isLoadingLedger.set(false);
                },
                error: () => {
                    this.transactions.set([]);
                    this.isLoadingLedger.set(false);
                },
            });
    }
}
