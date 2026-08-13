import { TestBed } from '@angular/core/testing';
import { AppCurrencyPipe } from './app-currency.pipe';
import { CurrencyStore } from '../../core/services/currency.store';

describe('AppCurrencyPipe', () => {
    let pipe: AppCurrencyPipe;
    let store: CurrencyStore;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [AppCurrencyPipe, CurrencyStore] });
        store = TestBed.inject(CurrencyStore);
        store.setCurrency('BDT');
        pipe = TestBed.inject(AppCurrencyPipe);
    });

    it('should format with the taka sign for BDT', () => {
        const formatted = pipe.transform(1500);
        expect(formatted).toContain('৳');
        expect(formatted).toContain('1,500');
        expect(formatted).not.toContain('BDT');
        expect(formatted).not.toContain('$');
    });

    it('should honour an explicit currency override', () => {
        const formatted = pipe.transform(42, 'symbol', '1.2-2', 'USD');
        expect(formatted).toContain('$');
    });
});
