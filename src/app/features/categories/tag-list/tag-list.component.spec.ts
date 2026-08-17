import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { TagListComponent } from './tag-list.component';
import { TagService } from '../../../core/services/tag.service';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, CategoryType } from '../../../core/models/category.model';

describe('TagListComponent', () => {
    let fixture: ComponentFixture<TagListComponent>;
    let component: TagListComponent;
    let tagServiceSpy: jasmine.SpyObj<TagService>;
    let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
    let toastServiceSpy: jasmine.SpyObj<ToastService>;
    let router: Router;

    const mockCategories: Category[] = [
        { id: 'cat-1', name: 'Groceries', color: '#6366f1', icon: 'shopping_cart', type: CategoryType.Expense, budgetLimit: 500, userId: 'u1' },
        { id: 'cat-2', name: 'Freelance', color: '#10b981', icon: 'work', type: CategoryType.Income, budgetLimit: 0, userId: 'u1' },
    ];

    beforeEach(async () => {
        tagServiceSpy = jasmine.createSpyObj(
            'TagService',
            [
                'loadTags',
                'loadCategoryTags',
                'createTag',
                'createTagForCategory',
                'assignTagToCategory',
                'unassignTagFromCategory',
            ],
            {
                tags: signal(['Groceries', 'Personal', 'Client Dinner', 'Reimbursable']),
                categoryTags: signal({
                    'cat-1': ['Groceries', 'Personal'],
                    'cat-2': ['Freelance'],
                }),
                isLoading: signal(false),
            },
        );
        tagServiceSpy.loadTags.and.returnValue(of(['Groceries', 'Personal', 'Client Dinner', 'Reimbursable']));
        tagServiceSpy.loadCategoryTags.and.returnValue(of([]));
        tagServiceSpy.createTag.and.returnValue(of('NewTag'));
        tagServiceSpy.createTagForCategory.and.returnValue(of('NewTag'));
        tagServiceSpy.assignTagToCategory.and.returnValue(of(undefined));
        tagServiceSpy.unassignTagFromCategory.and.returnValue(of(undefined));

        categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories'], {
            categories: signal(mockCategories),
            isLoading: signal(false),
        });
        categoryServiceSpy.getCategories.and.returnValue(of(mockCategories));

        toastServiceSpy = jasmine.createSpyObj('ToastService', ['show', 'error']);

        await TestBed.configureTestingModule({
            imports: [TagListComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                { provide: TagService, useValue: tagServiceSpy },
                { provide: CategoryService, useValue: categoryServiceSpy },
                { provide: ToastService, useValue: toastServiceSpy },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(TagListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the TagListComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should render all tag cards in the registry', () => {
        const cards = fixture.nativeElement.querySelectorAll('.tag-card');
        expect(cards.length).toBe(4);
    });

    it('should compute summary metrics accurately', () => {
        expect(component.totalTags()).toBe(4);
        expect(component.boundCount()).toBe(2); // Groceries and Personal
        expect(component.unboundCount()).toBe(2); // Client Dinner and Reimbursable
        expect(component.uniqueColorsCount()).toBeGreaterThan(0);
    });

    it('should filter tags by search query', () => {
        component.onSearchChange('client');
        fixture.detectChanges();

        expect(component.filteredTags().length).toBe(1);
        expect(component.filteredTags()[0].name).toBe('Client Dinner');
    });

    it('should filter tags by scope', () => {
        component.setScopeFilter('bound');
        fixture.detectChanges();
        expect(component.filteredTags().length).toBe(2);
        expect(component.filteredTags().every((t) => t.boundCategories.length > 0)).toBeTrue();

        component.setScopeFilter('unbound');
        fixture.detectChanges();
        expect(component.filteredTags().length).toBe(2);
        expect(component.filteredTags().every((t) => t.boundCategories.length === 0)).toBeTrue();
    });

    it('should filter tags by category', () => {
        component.categoryFilter.set('cat-1');
        fixture.detectChanges();
        expect(component.filteredTags().length).toBe(2);
    });

    it('should compute activeFiltersCount correctly across filter dimensions', () => {
        expect(component.activeFiltersCount()).toBe(0);

        component.setScopeFilter('bound');
        expect(component.activeFiltersCount()).toBe(1);

        component.categoryFilter.set('cat-1');
        expect(component.activeFiltersCount()).toBe(2);

        component.colorFilter.set('#6366f1');
        expect(component.activeFiltersCount()).toBe(3);

        component.sortOption.set('items-desc');
        expect(component.activeFiltersCount()).toBe(4);
    });

    it('should clear and reset all filters and reload data when resetAllFilters is called', () => {
        component.onSearchChange('groceries');
        component.setScopeFilter('bound');
        component.categoryFilter.set('cat-1');
        component.colorFilter.set('#6366f1');
        component.sortOption.set('items-desc');
        expect(component.isFilterActive()).toBeTrue();
        expect(component.activeFiltersCount()).toBe(4);

        tagServiceSpy.loadTags.calls.reset();
        component.resetAllFilters();
        fixture.detectChanges();

        expect(component.searchQuery()).toBe('');
        expect(component.scopeFilter()).toBe('all');
        expect(component.categoryFilter()).toBeNull();
        expect(component.colorFilter()).toBeNull();
        expect(component.sortOption()).toBe('name-asc');
        expect(component.activeFiltersCount()).toBe(0);
        expect(component.isFilterActive()).toBeFalse();
        expect(tagServiceSpy.loadTags).toHaveBeenCalled();
    });

    it('should render filter trigger button with active count and clear filters button', () => {
        component.setScopeFilter('bound');
        component.categoryFilter.set('cat-1');
        fixture.detectChanges();

        const clearBtn = fixture.nativeElement.querySelector('.filter-clear');
        expect(clearBtn).toBeTruthy();
        expect(clearBtn.textContent).toContain('Clear Filters (2)');

        const filterPopover = fixture.nativeElement.querySelector('app-filter-popover');
        expect(filterPopover).toBeTruthy();
    });

    it('should refresh tag data on demand', () => {
        component.refreshData();
        expect(tagServiceSpy.loadTags).toHaveBeenCalled();
        expect(categoryServiceSpy.getCategories).toHaveBeenCalled();
        expect(toastServiceSpy.show).toHaveBeenCalledWith('Tags catalog and category bindings refreshed');
    });

    it('should submit tag creation for global tag', () => {
        component.openCreateModal();
        component.onNameChange('Vacation2026');
        component.newTagCategory.set('');
        component.submitCreate();

        expect(tagServiceSpy.createTag).toHaveBeenCalledWith('Vacation2026');
        expect(toastServiceSpy.show).toHaveBeenCalledWith('Tag "#NewTag" created successfully');
        expect(component.isCreateModalOpen()).toBeFalse();
    });

    it('should submit tag creation with category binding', () => {
        component.openCreateModal();
        component.onNameChange('Medical');
        component.newTagCategory.set('cat-1');
        component.submitCreate();

        expect(tagServiceSpy.createTagForCategory).toHaveBeenCalledWith('Medical', 'cat-1');
        expect(toastServiceSpy.show).toHaveBeenCalledWith('Tag "#NewTag" created and assigned to category');
        expect(component.isCreateModalOpen()).toBeFalse();
    });

    it('should open binding modal and bind a category to tag', () => {
        const tag = component.tagCards()[0];
        component.openBindingModal(tag, new MouseEvent('click'));
        expect(component.isBindingModalOpen()).toBeTrue();
        expect(component.activeTagForBinding()?.name).toBe(tag.name);

        component.selectedCategoryToBind.set('cat-2');
        component.bindCategoryToTag();

        expect(tagServiceSpy.assignTagToCategory).toHaveBeenCalledWith('cat-2', tag.name);
        expect(component.isBindingModalOpen()).toBeFalse();
    });

    it('should unbind category from a tag', () => {
        const event = new MouseEvent('click');
        spyOn(event, 'stopPropagation');
        component.unbindCategoryFromTag('cat-1', 'Groceries', event);

        expect(event.stopPropagation).toHaveBeenCalled();
        expect(tagServiceSpy.unassignTagFromCategory).toHaveBeenCalledWith('cat-1', 'Groceries');
        expect(toastServiceSpy.show).toHaveBeenCalledWith('Unbound "#Groceries" from category');
    });

    it('should navigate to category when category chip clicked', () => {
        const navigateSpy = spyOn(router, 'navigate');
        const event = new MouseEvent('click');
        spyOn(event, 'stopPropagation');

        component.navigateToCategory(mockCategories[0], event);
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(navigateSpy).toHaveBeenCalledWith(['/categories', 'cat-1']);
    });
});
