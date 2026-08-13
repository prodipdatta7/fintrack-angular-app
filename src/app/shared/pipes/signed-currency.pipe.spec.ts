import { TestBed } from '@angular/core/testing';
import { SignedCurrencyPipe } from './signed-currency.pipe';
import { CategoryType } from '../../core/models/category.model';
import { CurrencyStore } from '../../core/services/currency.store';

describe('SignedCurrencyPipe', () => {
    let pipe: SignedCurrencyPipe;
    let store: CurrencyStore;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [SignedCurrencyPipe, CurrencyStore] });
        store = TestBed.inject(CurrencyStore);
        store.setCurrency('USD');
        pipe = TestBed.inject(SignedCurrencyPipe);
    });

    it('should prefix income with a plus', () => {
        expect(pipe.transform(6200, CategoryType.Income)).toBe('+$6,200.00');
    });

    it('should prefix expense with a minus', () => {
        expect(pipe.transform(184.5, CategoryType.Expense)).toBe('-$184.50');
    });

    it('should format the absolute value regardless of the stored sign', () => {
        expect(pipe.transform(-184.5, CategoryType.Expense)).toBe('-$184.50');
    });

    it('should leave zero unsigned', () => {
        expect(pipe.transform(0, CategoryType.Expense)).toBe('$0.00');
    });

    it('should treat null and undefined as zero', () => {
        expect(pipe.transform(null, CategoryType.Income)).toBe('$0.00');
        expect(pipe.transform(undefined, CategoryType.Income)).toBe('$0.00');
    });

    it('should omit the sign when no type is given', () => {
        expect(pipe.transform(42)).toBe('$42.00');
    });

    it('should honour a different currency code', () => {
        expect(pipe.transform(1500, CategoryType.Income, 'EUR')).toBe('+€1,500.00');
    });

    it('should use the store currency sign by default', () => {
        store.setCurrency('BDT');
        expect(pipe.transform(100, CategoryType.Expense)).toBe('-৳100.00');
    });
});
