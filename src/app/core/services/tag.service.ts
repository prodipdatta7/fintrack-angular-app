import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class TagService {
    private readonly STORAGE_KEY = 'fintrack_global_tags';

    private readonly defaultTags = [
        'Groceries',
        'Utilities',
        'Salary',
        'Rent',
        'Travel',
        'Dining',
        'Tax-Deductible',
        'Reimbursable',
    ];

    tags = signal<string[]>(this.loadTags());

    private loadTags(): string[] {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch {
                // Fallback to defaults
            }
        }
        return [...this.defaultTags];
    }

    addTag(tag: string): string | null {
        const trimmed = tag.trim().replace(/^#/, '');
        if (!trimmed) return null;

        const current = this.tags();
        const existing = current.find((t) => t.toLowerCase() === trimmed.toLowerCase());
        if (existing) {
            return existing;
        }

        const updated = [...current, trimmed];
        this.tags.set(updated);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
        return trimmed;
    }

    addTags(tagList: string[]): void {
        tagList.forEach((t) => this.addTag(t));
    }
}
