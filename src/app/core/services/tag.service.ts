import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, concatMap, finalize, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface TagDto {
    id: string;
    name: string;
}

const TAG_COLORS_STORAGE_KEY = 'fintrack_tag_colors';

const DEFAULT_TAG_PALETTE = [
    '#6366f1',
    '#a855f7',
    '#ec4899',
    '#f43f5e',
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#10b981',
    '#06b6d4',
    '#3b82f6',
    '#8b5cf6',
    '#14b8a6',
    '#84cc16',
    '#64748b',
];

function hashTag(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash << 5) - hash + name.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

/**
 * Server-backed tag registry.
 *
 * - `tags` is the user's global tag list (Mongo `tags` collection).
 * - `categoryTags` maps a category id to the tag names bound to it
 *   (Mongo `category_tags` collection).
 * - `tagColors` persists user-chosen colors per tag.
 */
@Injectable({
    providedIn: 'root',
})
export class TagService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    tags = signal<string[]>([]);
    categoryTags = signal<Record<string, string[]>>({});
    tagColors = signal<Record<string, string>>(this.loadPersistedColors());
    isLoading = signal(false);

    loadTags(): Observable<string[]> {
        this.isLoading.set(true);
        return this.http.get<TagDto[]>(`${this.apiUrl}/get-tags`).pipe(
            map((items) => items.map((tag) => tag.name)),
            tap((names) => this.tags.set(names)),
            finalize(() => this.isLoading.set(false)),
        );
    }

    loadCategoryTags(categoryId: string): Observable<string[]> {
        return this.http
            .get<string[]>(`${this.apiUrl}/get-category-tags/${categoryId}`)
            .pipe(tap((names) => this.setCategoryTags(categoryId, names)));
    }

    /** Tags currently bound to a category (names). */
    tagsForCategory(categoryId: string): string[] {
        return this.categoryTags()[categoryId] ?? [];
    }

    isTagAssignedToCategory(categoryId: string, tag: string): boolean {
        const needle = tag.trim().replace(/^#/, '').toLowerCase();
        return this.tagsForCategory(categoryId).some((t) => t.toLowerCase() === needle);
    }

    /** Gets the user-assigned custom color or falls back to hash-based palette color. */
    getTagColor(tagName: string, fallbackPalette?: ReadonlyArray<{ readonly value: string }>): string {
        const key = tagName.trim().replace(/^#/, '').toLowerCase();
        const custom = this.tagColors()[key];
        if (custom) return custom;

        const palette = fallbackPalette?.map((p) => p.value) || DEFAULT_TAG_PALETTE;
        const hash = hashTag(key);
        return palette[hash % palette.length];
    }

    /** Persists a custom color for a tag name. */
    setTagColor(tagName: string, color: string): void {
        const key = tagName.trim().replace(/^#/, '').toLowerCase();
        if (!key || !color) return;
        const updated = { ...this.tagColors(), [key]: color };
        this.tagColors.set(updated);
        try {
            localStorage.setItem(TAG_COLORS_STORAGE_KEY, JSON.stringify(updated));
        } catch {
            // ignore storage quota errors
        }
    }

    /**
     * Creates a tag (reusing any case-insensitive match) and binds it to the
     * given category in one step. Resolves to the canonical tag name or null.
     */
    createTagForCategory(tag: string, categoryId: string, color?: string): Observable<string | null> {
        return this.createTag(tag, color).pipe(
            concatMap((name) => (name ? this.assignTagToCategory(categoryId, name).pipe(map(() => name)) : of(null))),
        );
    }

    /** Creates a global tag (or returns the existing one) for the current user. */
    createTag(tag: string, color?: string): Observable<string | null> {
        const trimmed = tag.trim().replace(/^#/, '');
        if (!trimmed) return of(null);

        return this.http.post<TagDto>(`${this.apiUrl}/create-tag`, { name: trimmed }).pipe(
            map((dto) => dto.name),
            tap((name) => {
                this.upsertGlobalTag(name);
                if (color) {
                    this.setTagColor(name, color);
                }
            }),
            catchError(() => of(null)),
        );
    }

    /** Binds an existing global tag to a category. */
    assignTagToCategory(categoryId: string, tag: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/assign-tag-to-category`, { categoryId, tag }).pipe(
            tap(() => {
                const current = this.categoryTags()[categoryId] ?? [];
                if (!current.some((t) => t.toLowerCase() === tag.toLowerCase())) {
                    this.setCategoryTags(categoryId, [...current, tag]);
                }
            }),
        );
    }

    /** Removes a tag binding from a category (the global tag stays available). */
    unassignTagFromCategory(categoryId: string, tag: string): Observable<void> {
        const params = new HttpParams().set('tag', tag);
        return this.http.delete<void>(`${this.apiUrl}/unassign-tag-from-category/${categoryId}`, { params }).pipe(
            tap(() => {
                const current = this.categoryTags()[categoryId] ?? [];
                this.setCategoryTags(
                    categoryId,
                    current.filter((t) => t.toLowerCase() !== tag.toLowerCase()),
                );
            }),
        );
    }

    private upsertGlobalTag(name: string): void {
        if (name && !this.tags().some((t) => t.toLowerCase() === name.toLowerCase())) {
            this.tags.set([...this.tags(), name]);
        }
    }

    private setCategoryTags(categoryId: string, names: string[]): void {
        const map = { ...this.categoryTags() };
        map[categoryId] = names;
        this.categoryTags.set(map);
    }

    private loadPersistedColors(): Record<string, string> {
        try {
            const raw = localStorage.getItem(TAG_COLORS_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }
}
