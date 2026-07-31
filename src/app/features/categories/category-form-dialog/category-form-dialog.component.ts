import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryType } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (visible) {
      <div class="modal-overlay">
        <div class="modal-card glass-card">
          <div class="modal-header">
            <h3><i class="pi pi-tag glow-text-cyan"></i> Add New Category</h3>
            <button (click)="close()" class="close-btn"><i class="pi pi-times"></i></button>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="modal-form">
            <div class="form-group">
              <label for="name">Category Name</label>
              <input id="name" type="text" formControlName="name" placeholder="e.g. Salary, Groceries, Rent" />
            </div>

            <div class="form-group">
              <label for="type">Category Type</label>
              <select id="type" formControlName="type">
                <option [value]="0">Income 🟢</option>
                <option [value]="1">Expense 🔴</option>
              </select>
            </div>

            <div class="form-group">
              <label for="icon">Icon Identifier</label>
              <input id="icon" type="text" formControlName="icon" placeholder="pi-shopping-cart" />
            </div>

            <div class="form-group">
              <label for="color">Badge Color (Hex)</label>
              <input id="color" type="color" formControlName="color" />
            </div>

            <div class="modal-actions">
              <button type="button" (click)="close()" class="btn-secondary">Cancel</button>
              <button type="submit" [disabled]="form.invalid || isSubmitting" class="btn-primary">
                Save Category
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-card {
      width: 100%;
      max-width: 440px;
      padding: 1.75rem;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .modal-header h3 {
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.2rem;
      cursor: pointer;
    }
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .form-group label {
      font-size: 0.85rem;
      color: #cbd5e1;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      border: none;
      border-radius: 8px;
      padding: 0.6rem 1.2rem;
      cursor: pointer;
    }
  `]
})
export class CategoryFormDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);

  isSubmitting = false;

  form = this.fb.group({
    name: ['', Validators.required],
    type: [CategoryType.Expense, Validators.required],
    icon: ['pi-tag', Validators.required],
    color: ['#6366f1', Validators.required]
  });

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  submit(): void {
    if (this.form.invalid) return;

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
        this.form.reset({ name: '', type: CategoryType.Expense, icon: 'pi-tag', color: '#6366f1' });
        this.close();
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }
}
