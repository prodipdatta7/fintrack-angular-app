import { findProvider, officialLogoUrl } from './account-providers';

describe('account-providers', () => {
    it('should resolve known providers by name or alias', () => {
        expect(findProvider({ provider: 'bKash' })?.id).toBe('bkash');
        expect(findProvider({ name: 'Nagad Wallet' })?.id).toBe('nagad');
        expect(findProvider({ provider: 'Prime Bank' })?.id).toBe('prime-bank');
    });

    it('should build a Clearbit logo URL for official domains', () => {
        expect(officialLogoUrl('bkash.com')).toBe('https://logo.clearbit.com/bkash.com');
        expect(officialLogoUrl('')).toBeNull();
    });
});
