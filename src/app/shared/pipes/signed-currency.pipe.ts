import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { formatCurrency } from '@angular/common';
import { CategoryType } from '../../core/models/category.model';
import { CurrencyStore } from '../../core/services/currency.store';
import { currencySign } from '../utils/currency-sign';

/**
 * Formats a ledger amount with the sign implied by its transaction type:
 * income reads "+৳6,200.00", expense reads "-৳184.50".
 */
@Pipe({
    name: 'signedCurrency',
    standalone: true,
    pure: false,
})
export class SignedCurrencyPipe implements PipeTransform {
    private readonly locale = inject(LOCALE_ID);
    private readonly currencyStore = inject(CurrencyStore);

    transform(value: number | null | undefined, type?: CategoryType, currencyCode?: string): string {
        const code = currencyCode || this.currencyStore.currencyCode();
        const amount = Math.abs(Number(value ?? 0));
        const formatted = formatCurrency(amount, this.locale, currencySign(code, this.locale), code);

        if (amount === 0 || type === undefined) return formatted;
        return `${type === CategoryType.Income ? '+' : '-'}${formatted}`;
    }
}
