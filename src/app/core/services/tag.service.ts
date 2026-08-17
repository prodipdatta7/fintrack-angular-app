import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, concatMap, finalize, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface TagDto {
    id: string;
    name: string;
}

/**
 * Server-backed tag registry.
 *
 * - `tags` is the user's global tag list (Mongo `tags` collection).
 * - `categoryTags` maps a category id to the tag names bound to it
 *   (Mongo `category_tags` collection).
 *
 * Nothing is stored in the browser — all reads/writes hit the API.
 */
@Injectable({
    providedIn: 'root',
})
export class TagService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    tags = signal<string[]>([]);
    categoryTags = signal<Record<string, string[]>>({});
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

    /**
     * Creates a tag (reusing any case-insensitive match) and binds it to the
     * given category in one step. Resolves to the canonical tag name or null.
     */
    createTagForCategory(tag: string, categoryId: string): Observable<string | null> {
        return this.createTag(tag).pipe(
            concatMap((name) => (name ? this.assignTagToCategory(categoryId, name).pipe(map(() => name)) : of(null))),
        );
    }

    /** Creates a global tag (or returns the existing one) for the current user. */
    createTag(tag: string): Observable<string | null> {
        const trimmed = tag.trim().replace(/^#/, '');
        if (!trimmed) return of(null);

        return this.http.post<TagDto>(`${this.apiUrl}/create-tag`, { name: trimmed }).pipe(
            map((dto) => dto.name),
            tap((name) => this.upsertGlobalTag(name)),
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
}
