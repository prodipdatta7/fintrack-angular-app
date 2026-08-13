import { formatCurrency } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyStore } from '../../core/services/currency.store';
import { currencySign } from '../utils/currency-sign';

/**
 * Formats money using the signed-in user's settings currency sign (default ৳).
 *
 * Usage: `{{ amount | appCurrency }}` or `{{ amount | appCurrency:'symbol':'1.0-0' }}`
 */
@Pipe({
    name: 'appCurrency',
    standalone: true,
    pure: false,
})
export class AppCurrencyPipe implements PipeTransform {
    private readonly locale = inject(LOCALE_ID);
    private readonly currencyStore = inject(CurrencyStore);

    transform(
        value: number | null | undefined,
        display: 'code' | 'symbol' | 'symbol-narrow' | string = 'symbol',
        digitsInfo = '1.2-2',
        currencyCode?: string,
    ): string {
        const code = currencyCode || this.currencyStore.currencyCode();
        const amount = Number(value ?? 0);
        const symbol = display === 'code' ? `${code} ` : currencySign(code, this.locale);

        return formatCurrency(amount, this.locale, symbol, code, digitsInfo);
    }
}
