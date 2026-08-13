import { currencySign } from './currency-sign';

describe('currencySign', () => {
    it('should return the taka sign for BDT instead of the ISO name', () => {
        expect(currencySign('BDT', 'en-US')).toBe('৳');
        expect(currencySign('bdt', 'en-US')).toBe('৳');
    });

    it('should return common currency signs', () => {
        expect(currencySign('USD', 'en-US')).toBe('$');
        expect(currencySign('EUR', 'en-US')).toBe('€');
        expect(currencySign('GBP', 'en-US')).toBe('£');
    });
});
