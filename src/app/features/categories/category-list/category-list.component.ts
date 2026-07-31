import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryFormDialogComponent } from '../category-form-dialog/category-form-dialog.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CategoryFormDialogComponent],
  template: `
    <div class="page-header">
      <div>
        <h2>Financial <span class="glow-text-indigo">Categories</span></h2>
        <p>Organize your income & expense categories</p>
      </div>
      <button (click)="showAddDialog = true" class="btn-primary">
        <i class="pi pi-plus"></i> Add Category
      </button>
    </div>

    @if (categoryService.isLoading()) {
      <div class="loading-spinner">
        <i class="pi pi-spin pi-spinner glow-text-cyan" style="font-size: 2rem;"></i>
      </div>
    } @else {
      <div class="categories-grid">
        @for (category of categoryService.categories(); track category.id) {
          <div class="category-card glass-card">
            <div class="card-icon" [style.background-color]="category.color + '22'" [style.color]="category.color">
              <i class="pi" [class]="category.icon"></i>
            </div>
            <div class="card-details">
              <h4>{{ category.name }}</h4>
              <span class="type-badge" [class.income]="category.type === 0" [class.expense]="category.type === 1">
                {{ category.type === 0 ? 'Income 🟢' : 'Expense 🔴' }}
              </span>
            </div>
          </div>
        } @empty {
          <div class="empty-state glass-card">
            <i class="pi pi-inbox" style="font-size: 2.5rem; color: #64748b;"></i>
            <p>No categories created yet. Click "Add Category" to get started.</p>
          </div>
        }
      </div>
    }

    <app-category-form-dialog [(visible)]="showAddDialog"></app-category-form-dialog>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .page-header h2 {
      font-size: 1.8rem;
    }
    .page-header p {
      color: #94a3b8;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.25rem;
    }
    .category-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
    }
    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }
    .card-details h4 {
      font-size: 1.05rem;
      margin-bottom: 0.25rem;
    }
    .type-badge {
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-weight: 600;
    }
    .type-badge.income {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }
    .type-badge.expense {
      background: rgba(244, 63, 94, 0.15);
      color: #f43f5e;
    }
    .loading-spinner, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      text-color: #94a3b8;
    }
  `]
})
export class CategoryListComponent implements OnInit {
  readonly categoryService = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);
  showAddDialog = false;

  ngOnInit(): void {
    this.categoryService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
