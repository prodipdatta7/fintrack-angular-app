import { getCurrencySymbol } from '@angular/common';

/** Preferred glyph signs — CLDR "wide" often returns the ISO code for BDT. */
const CURRENCY_SIGNS: Record<string, string> = {
    BDT: '৳',
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CNY: '¥',
    KRW: '₩',
    AUD: 'A$',
    CAD: 'C$',
};

/** Returns the currency sign (৳, $, €…) rather than the ISO name (BDT, USD…). */
export function currencySign(code: string, locale: string): string {
    const normalized = (code || '').trim().toUpperCase();
    if (CURRENCY_SIGNS[normalized]) {
        return CURRENCY_SIGNS[normalized];
    }

    const narrow = getCurrencySymbol(normalized, 'narrow', locale);
    if (narrow && narrow !== normalized) {
        return narrow;
    }

    const wide = getCurrencySymbol(normalized, 'wide', locale);
    return wide && wide !== normalized ? wide : normalized;
}
