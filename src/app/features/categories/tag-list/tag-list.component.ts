import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';
import { TagService } from '../../../core/services/tag.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, CategoryType } from '../../../core/models/category.model';
import { CategorySubnavComponent } from '../category-subnav/category-subnav.component';
import { FilterPopoverComponent } from '../../../shared/components/filter-popover/filter-popover.component';
import { MatSelectModule } from '@angular/material/select';
import { TAG_COLOR_PALETTE } from '../tags-panel/tags-panel.component';

export interface TagItem {
    name: string;
    slug: string;
    color: string;
    itemCount: number;
    boundCategories: Category[];
}

function hashName(name: string): number {
    let hash = 0;
    const source = name.trim().toLowerCase();
    for (let i = 0; i < source.length; i++) {
        hash = (hash << 5) - hash + source.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function tagSlug(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/^#/, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

@Component({
    selector: 'app-tag-list',
    standalone: true,
    imports: [FormsModule, MatSelectModule, CategorySubnavComponent, FilterPopoverComponent],
    templateUrl: './tag-list.component.html',
    styleUrl: './tag-list.component.scss',
})
export class TagListComponent implements OnInit {
    readonly CategoryType = CategoryType;
    readonly tagService = inject(TagService);
    readonly categoryService = inject(CategoryService);
    private readonly toast = inject(ToastService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly router = inject(Router);

    readonly palette = TAG_COLOR_PALETTE;

    filtersOpen = false;

    readonly searchQuery = signal('');
    readonly colorFilter = signal<string | null>(null);
    readonly scopeFilter = signal<'all' | 'bound' | 'unbound'>('all');
    readonly categoryFilter = signal<string | null>(null);
    readonly sortOption = signal<'name-asc' | 'name-desc' | 'items-desc' | 'bound-desc'>('name-asc');

    // Create Tag Modal State
    readonly isCreateModalOpen = signal(false);
    readonly newTagName = signal('');
    readonly newTagColor = signal('#6366f1');
    readonly newTagCategory = signal<string>('');
    readonly createError = signal('');
    readonly isSaving = signal(false);

    // Manage Bindings Modal State
    readonly isBindingModalOpen = signal(false);
    readonly activeTagForBinding = signal<TagItem | null>(null);
    readonly selectedCategoryToBind = signal<string>('');

    readonly tagCards = computed<TagItem[]>(() => {
        const rawTags = this.tagService.tags();
        const categories = this.categoryService.categories();
        const categoryTagsMap = this.tagService.categoryTags();

        return rawTags.map((name) => {
            const hash = hashName(name);
            const color = this.palette[hash % this.palette.length].value;
            const needle = name.toLowerCase();

            // Find categories where this tag is bound
            const boundCategories = categories.filter((cat) => {
                const assigned = categoryTagsMap[cat.id] ?? [];
                return assigned.some((t) => t.toLowerCase() === needle);
            });

            return {
                name,
                slug: tagSlug(name),
                color,
                itemCount: 8 + (hash % 150),
                boundCategories,
            };
        });
    });

    readonly filteredTags = computed<TagItem[]>(() => {
        const query = this.searchQuery().trim().toLowerCase();
        const color = this.colorFilter();
        const scope = this.scopeFilter();
        const catId = this.categoryFilter();
        const sort = this.sortOption();

        let list = this.tagCards().filter((tag) => {
            const matchesQuery = !query || tag.name.toLowerCase().includes(query) || tag.slug.includes(query);
            const matchesColor = !color || tag.color === color;
            const matchesScope =
                scope === 'all' ||
                (scope === 'bound' && tag.boundCategories.length > 0) ||
                (scope === 'unbound' && tag.boundCategories.length === 0);
            const matchesCat = !catId || tag.boundCategories.some((c) => c.id === catId);

            return matchesQuery && matchesColor && matchesScope && matchesCat;
        });

        if (sort === 'name-asc') {
            list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === 'name-desc') {
            list = [...list].sort((a, b) => b.name.localeCompare(a.name));
        } else if (sort === 'items-desc') {
            list = [...list].sort((a, b) => b.itemCount - a.itemCount);
        } else if (sort === 'bound-desc') {
            list = [...list].sort((a, b) => b.boundCategories.length - a.boundCategories.length);
        }

        return list;
    });

    readonly totalTags = computed(() => this.tagService.tags().length);
    readonly boundCount = computed(() => {
        return this.tagCards().filter((t) => t.boundCategories.length > 0).length;
    });
    readonly unboundCount = computed(() => {
        return this.tagCards().filter((t) => t.boundCategories.length === 0).length;
    });
    readonly uniqueColorsCount = computed(() => {
        const set = new Set(this.tagCards().map((t) => t.color));
        return set.size;
    });

    readonly slugPreview = computed(() => tagSlug(this.newTagName()));
    readonly nameCount = computed(() => this.newTagName().length);
    readonly nameTooLong = computed(() => this.newTagName().length > 30);
    readonly nameEmpty = computed(() => !this.newTagName().trim());
    readonly nameDuplicate = computed(() => {
        const needle = tagSlug(this.newTagName());
        if (!needle) return false;
        return this.tagService.tags().some((name) => tagSlug(name) === needle);
    });
    readonly canCreate = computed(() => !this.nameEmpty() && !this.nameDuplicate() && !this.nameTooLong());

    /** Active filter count tracking all non-default rules */
    readonly activeFiltersCount = computed(() => {
        let count = 0;
        if (this.scopeFilter() !== 'all') count++;
        if (this.categoryFilter() !== null) count++;
        if (this.colorFilter() !== null) count++;
        if (this.sortOption() !== 'name-asc') count++;
        return count;
    });

    readonly isFilterActive = computed(() => {
        return !!this.searchQuery().trim() || this.activeFiltersCount() > 0;
    });

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.tagService.loadTags().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => {} });
        this.categoryService
            .getCategories()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (categories) => {
                    // Preload category tags mapping for all categories
                    for (const cat of categories) {
                        this.tagService.loadCategoryTags(cat.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
                    }
                },
                error: () => {},
            });
    }

    refreshData(): void {
        this.loadData();
        this.toast.show('Tags catalog and category bindings refreshed');
    }

    onSearchChange(value: string): void {
        this.searchQuery.set(value);
    }

    clearSearch(): void {
        this.searchQuery.set('');
    }

    toggleColorFilter(color: string): void {
        this.colorFilter.set(this.colorFilter() === color ? null : color);
    }

    setScopeFilter(scope: 'all' | 'bound' | 'unbound'): void {
        this.scopeFilter.set(scope);
    }

    colorCount(color: string): number {
        return this.tagCards().filter((card) => card.color === color).length;
    }

    resetAllFilters(): void {
        this.searchQuery.set('');
        this.colorFilter.set(null);
        this.scopeFilter.set('all');
        this.categoryFilter.set(null);
        this.sortOption.set('name-asc');
        this.loadData();
    }

    clearFilters(): void {
        this.resetAllFilters();
    }

    copyTagToClipboard(tagName: string, event: Event): void {
        event.stopPropagation();
        void navigator.clipboard.writeText(`#${tagName}`).then(() => {
            this.toast.show(`Copied "#${tagName}" to clipboard`);
        });
    }

    openCreateModal(): void {
        this.newTagName.set('');
        this.newTagColor.set('#6366f1');
        this.newTagCategory.set('');
        this.createError.set('');
        this.isCreateModalOpen.set(true);
    }

    closeCreateModal(): void {
        this.isCreateModalOpen.set(false);
        this.createError.set('');
    }

    openBindingModal(tag: TagItem, event: Event): void {
        event.stopPropagation();
        this.activeTagForBinding.set(tag);
        this.selectedCategoryToBind.set('');
        this.isBindingModalOpen.set(true);
    }

    closeBindingModal(): void {
        this.isBindingModalOpen.set(false);
        this.activeTagForBinding.set(null);
    }

    onOverlayClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.closeCreateModal();
            this.closeBindingModal();
        }
    }

    onNameChange(value: string): void {
        this.newTagName.set(value);
        this.createError.set('');
    }

    submitCreate(): void {
        const name = this.newTagName().trim().replace(/^#/, '');
        if (!name) {
            this.createError.set('Tag name is required.');
            return;
        }
        if (this.nameTooLong()) {
            this.createError.set('Tag name must be 30 characters or fewer.');
            return;
        }
        if (this.nameDuplicate()) {
            this.createError.set('That tag already exists.');
            return;
        }

        const chosenCatId = this.newTagCategory();
        this.isSaving.set(true);

        const request = chosenCatId
            ? this.tagService.createTagForCategory(name, chosenCatId)
            : this.tagService.createTag(name);

        request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (added) => {
                this.isSaving.set(false);
                if (added) {
                    this.toast.show(
                        chosenCatId
                            ? `Tag "#${added}" created and assigned to category`
                            : `Tag "#${added}" created successfully`,
                    );
                    this.closeCreateModal();
                } else {
                    this.createError.set('Could not create that tag');
                }
            },
            error: () => {
                this.isSaving.set(false);
                this.createError.set('Could not create that tag');
            },
        });
    }

    bindCategoryToTag(): void {
        const tag = this.activeTagForBinding();
        const categoryId = this.selectedCategoryToBind();
        if (!tag || !categoryId) return;

        this.tagService
            .assignTagToCategory(categoryId, tag.name)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.toast.show(`Bound "#${tag.name}" to category`);
                    this.closeBindingModal();
                },
                error: () => this.toast.error('Could not bind category'),
            });
    }

    unbindCategoryFromTag(categoryId: string, tagName: string, event: Event): void {
        event.stopPropagation();
        this.tagService
            .unassignTagFromCategory(categoryId, tagName)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.toast.show(`Unbound "#${tagName}" from category`),
                error: () => this.toast.error('Could not unbind category'),
            });
    }

    navigateToCategory(category: Category, event: Event): void {
        event.stopPropagation();
        this.router.navigate(['/categories', category.id]);
    }
}
