import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryType } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './category-form-dialog.component.html',
  styleUrl: './category-form-dialog.component.scss'
})
export class CategoryFormDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);

  CategoryType = CategoryType;
  errorMessage = '';
  isSubmitting = false;

  typeOptions = [
    { label: 'Income', value: CategoryType.Income },
    { label: 'Expense', value: CategoryType.Expense }
  ];

  form = this.fb.group({
    name: ['', Validators.required],
    type: [CategoryType.Expense, Validators.required],
    icon: ['shopping_cart', Validators.required],
    color: ['#6366f1', Validators.required]
  });

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  submit(): void {
    if (this.form.invalid) return;

    this.errorMessage = '';
    this.isSubmitting = true;
    const val = this.form.getRawValue();

    this.categoryService.createCategory({
      name: val.name!,
      type: Number(val.type),
      icon: val.icon!,
      color: val.color!
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.categoryService.getCategories().subscribe();
        this.form.reset({ name: '', type: CategoryType.Expense, icon: 'shopping_cart', color: '#6366f1' });
        this.close();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.error || 'Failed to create category.';
      }
    });
  }
}
