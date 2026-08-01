import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryType } from '../../../core/models/category.model';
import { CategoryFormDialogComponent } from '../category-form-dialog/category-form-dialog.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatIconModule, CategoryFormDialogComponent],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent implements OnInit {
  readonly categoryService = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);
  CategoryType = CategoryType;
  showAddDialog = false;

  searchText = signal('');

  filteredCategories = computed(() => {
    const categories = this.categoryService.categories();
    const search = this.searchText().toLowerCase().trim();
    if (!search) return categories;
    return categories.filter(c =>
      c.name.toLowerCase().includes(search)
    );
  });

  ngOnInit(): void {
    this.categoryService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
  }
}
