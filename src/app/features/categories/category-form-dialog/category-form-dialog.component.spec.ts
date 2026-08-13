import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { CategoryFormDialogComponent } from './category-form-dialog.component';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, CategoryType } from '../../../core/models/category.model';

const existing: Category = {
    id: 'cat-1',
    name: 'Housing & Rent',
    icon: '🏠',
    color: '#6366f1',
    type: CategoryType.Expense,
    budgetLimit: 1800,
    userId: 'u-1',
};

describe('CategoryFormDialogComponent', () => {
    let fixture: ComponentFixture<CategoryFormDialogComponent>;
    let component: CategoryFormDialogComponent;
    let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
    let toastService: ToastService;

    beforeEach(async () => {
        categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
            'createCategory',
            'updateCategory',
            'getCategories',
        ]);
        categoryServiceSpy.createCategory.and.returnValue(of('cat-new'));
        categoryServiceSpy.updateCategory.and.returnValue(of(void 0));
        categoryServiceSpy.getCategories.and.returnValue(of([]));
        Object.defineProperty(categoryServiceSpy, 'categories', { value: signal([]) });

        await TestBed.configureTestingModule({
            imports: [CategoryFormDialogComponent, NoopAnimationsModule],
            providers: [ToastService, { provide: CategoryService, useValue: categoryServiceSpy }],
        }).compileComponents();

        toastService = TestBed.inject(ToastService);
        fixture = TestBed.createComponent(CategoryFormDialogComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => toastService.clear());

    const open = (category: Category | null = null) => {
        component.visible = true;
        component.category = category;
        component.ngOnChanges({ visible: { currentValue: true } as never });
        fixture.detectChanges();
    };

    it('should open in create mode with the design defaults', () => {
        open();
        expect(component.isEditMode).toBeFalse();
        expect(component.form.value.icon).toBe('📁');
        expect(component.form.value.budgetLimit).toBe(0);
        expect(fixture.nativeElement.querySelector('.modal-header h3').textContent).toContain('Create Category');
    });

    it('should prefill and relabel in edit mode', () => {
        open(existing);
        expect(component.isEditMode).toBeTrue();
        expect(component.form.value.name).toBe('Housing & Rent');
        expect(component.form.value.budgetLimit).toBe(1800);
        expect(fixture.nativeElement.querySelector('.modal-header h3').textContent).toContain('Edit Category');
    });

    it('should create a category and raise a toast', () => {
        open();
        component.form.patchValue({ name: 'Subscriptions', icon: '📦', budgetLimit: 120 });
        component.submit();

        expect(categoryServiceSpy.createCategory).toHaveBeenCalledWith({
            name: 'Subscriptions',
            type: CategoryType.Expense,
            icon: '📦',
            color: '#6366f1',
            budgetLimit: 120,
        });
        expect(toastService.toasts()[0].message).toBe('New category created');
    });

    it('should update an existing category', () => {
        open(existing);
        component.form.patchValue({ budgetLimit: 2000 });
        component.submit();

        expect(categoryServiceSpy.updateCategory).toHaveBeenCalledWith(
            jasmine.objectContaining({ id: 'cat-1', budgetLimit: 2000 }),
        );
        expect(toastService.toasts()[0].message).toBe('Category updated');
    });

    it('should treat a blank budget limit as no cap', () => {
        open();
        component.form.patchValue({ name: 'Misc', budgetLimit: null as never });
        component.submit();

        expect(categoryServiceSpy.createCategory.calls.mostRecent().args[0].budgetLimit).toBe(0);
    });

    it('should still allow creating an income category', () => {
        open();
        component.form.patchValue({ name: 'Salary', type: CategoryType.Income });
        component.submit();

        expect(categoryServiceSpy.createCategory.calls.mostRecent().args[0].type).toBe(CategoryType.Income);
    });

    it('should not submit without a name', () => {
        open();
        component.form.patchValue({ name: '' });
        component.submit();
        expect(categoryServiceSpy.createCategory).not.toHaveBeenCalled();
    });

    it('should surface a server error without closing', () => {
        open();
        categoryServiceSpy.createCategory.and.returnValue(
            throwError(() => ({ error: { error: 'Category already exists.' } })),
        );

        component.form.patchValue({ name: 'Duplicate' });
        component.submit();

        expect(component.errorMessage).toBe('Category already exists.');
        expect(component.visible).toBeTrue();
    });
});
