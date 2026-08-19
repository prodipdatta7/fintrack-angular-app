import { Component, EventEmitter, Output, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { TagService } from '../../../core/services/tag.service';

export interface TagDisplay {
    name: string;
    slug: string;
    color: string;
    itemCount: number;
    scope: 'Global' | 'Category Specific';
}

export const TAG_COLOR_PALETTE = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Rose', value: '#ef4444' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Slate', value: '#94a3b8' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Lime', value: '#84cc16' },
] as const;

/** Deterministic pseudo-hash so a given tag always maps to the same color + count + scope. */
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

export interface CreateTagPayload {
    name: string;
    autoAssign: boolean;
    color?: string;
}

/**
 * Polished "Tags & Labels" management section for a category detail page.
 *
 * Purely presentational + local interaction state: it derives display-only
 * attributes (color, slug, mock item count) from the tag names and emits
 * assign / unassign / create events for the parent to persist.
 */
@Component({
    selector: 'app-tags-panel',
    standalone: true,
    imports: [FormsModule, MatSelectModule],
    templateUrl: './tags-panel.component.html',
    styleUrl: './tags-panel.component.scss',
})
export class TagsPanelComponent {
    private readonly tagService = inject(TagService, { optional: true });

    readonly categoryId = input.required<string>();
    readonly assignedTags = input<string[]>([]);
    readonly availableTags = input<string[]>([]);
    readonly isSaving = input(false);

    /** Bulk assignment of one or more global tag names to this category. */
    @Output() assignRequest = new EventEmitter<string[]>();
    /** Removal of a single tag binding from this category. */
    @Output() unassignRequest = new EventEmitter<string>();
    /** Creation of a new tag, optionally bound to this category immediately. */
    @Output() createRequest = new EventEmitter<CreateTagPayload>();

    readonly palette = TAG_COLOR_PALETTE;

    readonly modalOpen = signal(false);
    readonly activeTab = signal<'existing' | 'create'>('existing');
    readonly assignedQuery = signal('');
    readonly poolQuery = signal('');
    readonly colorFilter = signal<string | null>(null);
    readonly selected = signal<string[]>([]);
    readonly confirming = signal<string | null>(null);
    readonly nameInput = signal('');
    readonly selectedColor = signal('#6366f1');
    readonly autoAssign = signal(true);
    readonly createError = signal('');

    private confirmTimer: ReturnType<typeof setTimeout> | null = null;

    readonly assignedCards = computed(() => {
        if (typeof this.tagService?.tagColors === 'function') {
            this.tagService.tagColors();
        }
        return this.assignedTags().map((name) => this.toDisplay(name));
    });

    readonly showAssignedSearch = computed(() => this.assignedCards().length > 0);

    readonly filteredAssigned = computed(() => {
        const query = this.assignedQuery().trim().toLowerCase();
        if (!query) return this.assignedCards();
        return this.assignedCards().filter(
            (card) => card.name.toLowerCase().includes(query) || card.slug.includes(query),
        );
    });

    readonly poolCards = computed(() => {
        if (typeof this.tagService?.tagColors === 'function') {
            this.tagService.tagColors();
        }
        return this.availableTags().map((name) => this.toDisplay(name));
    });

    readonly filteredPool = computed(() => {
        const query = this.poolQuery().trim().toLowerCase();
        const color = this.colorFilter();
        return this.poolCards().filter((card) => {
            const matchesQuery = !query || card.name.toLowerCase().includes(query) || card.slug.includes(query);
            const matchesColor = !color || card.color === color;
            return matchesQuery && matchesColor;
        });
    });

    readonly selectionCount = computed(() => this.selected().length);

    readonly isAllSelected = computed(
        () =>
            this.filteredPool().length > 0 && this.filteredPool().every((card) => this.selected().includes(card.name)),
    );

    readonly slugPreview = computed(() => tagSlug(this.nameInput()));

    readonly nameCount = computed(() => this.nameInput().length);
    readonly nameTooLong = computed(() => this.nameInput().length > 30);
    readonly nameEmpty = computed(() => !this.nameInput().trim());

    readonly nameDuplicate = computed(() => {
        const needle = tagSlug(this.nameInput());
        if (!needle) return false;
        return [...this.assignedTags(), ...this.availableTags()].some((name) => tagSlug(name) === needle);
    });

    readonly canCreate = computed(() => !this.nameEmpty() && !this.nameDuplicate() && !this.nameTooLong());

    openModal(tab: 'existing' | 'create'): void {
        this.activeTab.set(tab);
        this.poolQuery.set('');
        this.colorFilter.set(null);
        this.selected.set([]);
        this.nameInput.set('');
        this.selectedColor.set('#6366f1');
        this.autoAssign.set(true);
        this.createError.set('');
        this.modalOpen.set(true);
    }

    closeModal(): void {
        this.modalOpen.set(false);
        this.clearConfirm();
    }

    onOverlayClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.closeModal();
        }
    }

    switchTab(tab: 'existing' | 'create'): void {
        this.activeTab.set(tab);
        this.createError.set('');
    }

    toggleAll(): void {
        if (this.isAllSelected()) {
            this.selected.set([]);
        } else {
            this.selected.set(this.filteredPool().map((card) => card.name));
        }
    }

    toggleSelect(name: string): void {
        this.selected.update((list) => (list.includes(name) ? list.filter((item) => item !== name) : [...list, name]));
    }

    toggleColorFilter(color: string): void {
        this.colorFilter.set(this.colorFilter() === color ? null : color);
    }

    colorCount(color: string): number {
        return this.poolCards().filter((card) => card.color === color).length;
    }

    requestUnbind(name: string): void {
        this.clearConfirm();
        if (this.confirming() === name) {
            this.confirming.set(null);
            this.unassignRequest.emit(name);
            return;
        }
        this.confirming.set(name);
        this.confirmTimer = setTimeout(() => this.confirming.set(null), 2600);
    }

    onNameChange(value: string): void {
        this.nameInput.set(value);
        this.createError.set('');
    }

    submitAssign(): void {
        if (this.selectionCount() === 0) return;
        this.assignRequest.emit(this.selected());
        this.closeModal();
    }

    submitCreate(): void {
        const name = this.nameInput().trim().replace(/^#/, '');
        if (!name) {
            this.createError.set('Tag name is required.');
            return;
        }
        if (this.nameTooLong()) {
            this.createError.set('Tag name must be 30 characters or fewer.');
            return;
        }
        if (this.nameDuplicate()) {
            this.createError.set('That tag already exists. Pick a different name.');
            return;
        }
        this.createRequest.emit({
            name,
            autoAssign: this.autoAssign(),
            color: this.selectedColor(),
        });
        this.closeModal();
    }

    private toDisplay(name: string): TagDisplay {
        const hash = hashName(name);
        const color =
            typeof this.tagService?.getTagColor === 'function'
                ? this.tagService.getTagColor(name, this.palette)
                : this.palette[hash % this.palette.length].value;
        const scope: 'Global' | 'Category Specific' = hash % 5 === 2 ? 'Category Specific' : 'Global';
        return {
            name,
            slug: tagSlug(name),
            color,
            itemCount: 8 + (hash % 410),
            scope,
        };
    }

    private clearConfirm(): void {
        if (this.confirmTimer) {
            clearTimeout(this.confirmTimer);
            this.confirmTimer = null;
        }
    }
}
