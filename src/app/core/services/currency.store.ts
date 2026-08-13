import { Injectable, computed, signal } from '@angular/core';

/** Matches backend UserSettings.Currency default. */
export const DEFAULT_CURRENCY = 'BDT';

/**
 * Display currency for money formatting. Kept separate from UserService so
 * pipes can resolve it without pulling HttpClient into every component test.
 */
@Injectable({
    providedIn: 'root',
})
export class CurrencyStore {
    private readonly code = signal(DEFAULT_CURRENCY);

    readonly currencyCode = computed(() => this.code());

    setCurrency(currency: string | null | undefined): void {
        const next = currency?.trim();
        this.code.set(next || DEFAULT_CURRENCY);
    }

    reset(): void {
        this.code.set(DEFAULT_CURRENCY);
    }
}
