import { AccountType } from '../../core/models/account.model';

export interface AccountProviderDef {
    id: string;
    name: string;
    accountType: AccountType;
    /** Official brand site — used to pull the live logo. */
    domain: string;
    color: string;
    /** Bundled fallback mark under /providers. */
    logo: string;
    /** Alternate labels used to match existing accounts. */
    aliases?: string[];
}

export const CUSTOM_PROVIDER_ID = 'custom';

export const ACCOUNT_PROVIDERS: AccountProviderDef[] = [
    // Mobile financial services
    {
        id: 'bkash',
        name: 'bKash',
        accountType: 'MFS',
        domain: 'bkash.com',
        color: '#E2136E',
        logo: '/providers/bkash.svg',
        aliases: ['bkash wallet'],
    },
    {
        id: 'nagad',
        name: 'Nagad',
        accountType: 'MFS',
        domain: 'nagad.com.bd',
        color: '#F6921E',
        logo: '/providers/nagad.svg',
        aliases: ['nagad wallet'],
    },
    {
        id: 'rocket',
        name: 'Rocket',
        accountType: 'MFS',
        domain: 'dutchbanglabank.com',
        color: '#8C3494',
        logo: '/providers/rocket.svg',
        aliases: ['dbbl rocket', 'dutch bangla rocket'],
    },
    {
        id: 'upay',
        name: 'Upay',
        accountType: 'MFS',
        domain: 'upaybd.com',
        color: '#0A2A66',
        logo: '/providers/upay.svg',
    },

    // Banks
    {
        id: 'prime-bank',
        name: 'Prime Bank',
        accountType: 'Bank',
        domain: 'primebank.com.bd',
        color: '#00833E',
        logo: '/providers/prime-bank.svg',
    },
    {
        id: 'city-bank',
        name: 'City Bank',
        accountType: 'Bank',
        domain: 'thecitybank.com',
        color: '#E31C23',
        logo: '/providers/city-bank.svg',
        aliases: ['the city bank'],
    },
    {
        id: 'brac-bank',
        name: 'BRAC Bank',
        accountType: 'Bank',
        domain: 'bracbank.com',
        color: '#1B3C8C',
        logo: '/providers/brac-bank.svg',
    },
    {
        id: 'dutch-bangla',
        name: 'Dutch-Bangla Bank',
        accountType: 'Bank',
        domain: 'dutchbanglabank.com',
        color: '#004B87',
        logo: '/providers/dutch-bangla.svg',
        aliases: ['dbbl'],
    },
    {
        id: 'eastern-bank',
        name: 'Eastern Bank',
        accountType: 'Bank',
        domain: 'ebl.com.bd',
        color: '#003DA5',
        logo: '/providers/eastern-bank.svg',
        aliases: ['ebl'],
    },
    {
        id: 'islami-bank',
        name: 'Islami Bank',
        accountType: 'Bank',
        domain: 'islamibankbd.com',
        color: '#006B3F',
        logo: '/providers/islami-bank.svg',
        aliases: ['ibbl', 'islami bank bangladesh'],
    },
    {
        id: 'standard-chartered',
        name: 'Standard Chartered',
        accountType: 'Bank',
        domain: 'sc.com',
        color: '#0072AA',
        logo: '/providers/standard-chartered.svg',
    },
    {
        id: 'hsbc',
        name: 'HSBC',
        accountType: 'Bank',
        domain: 'hsbc.com.bd',
        color: '#DB0011',
        logo: '/providers/hsbc.svg',
    },
    {
        id: 'sonali-bank',
        name: 'Sonali Bank',
        accountType: 'Bank',
        domain: 'sonalibank.com.bd',
        color: '#006A4E',
        logo: '/providers/sonali-bank.svg',
    },
    {
        id: 'janata-bank',
        name: 'Janata Bank',
        accountType: 'Bank',
        domain: 'janatabank-bd.com',
        color: '#1A5276',
        logo: '/providers/janata-bank.svg',
    },
    {
        id: 'agrani-bank',
        name: 'Agrani Bank',
        accountType: 'Bank',
        domain: 'agranibank.org',
        color: '#117A65',
        logo: '/providers/agrani-bank.svg',
    },
    {
        id: 'pubali-bank',
        name: 'Pubali Bank',
        accountType: 'Bank',
        domain: 'pubalibangla.com',
        color: '#1A5276',
        logo: '/providers/pubali-bank.svg',
    },
    {
        id: 'ucb',
        name: 'United Commercial Bank',
        accountType: 'Bank',
        domain: 'ucb.com.bd',
        color: '#C0392B',
        logo: '/providers/ucb.svg',
        aliases: ['ucb'],
    },
    {
        id: 'mutual-trust',
        name: 'Mutual Trust Bank',
        accountType: 'Bank',
        domain: 'mutualtrustbank.com',
        color: '#0E6655',
        logo: '/providers/mutual-trust.svg',
        aliases: ['mtb'],
    },
    {
        id: 'southeast-bank',
        name: 'Southeast Bank',
        accountType: 'Bank',
        domain: 'southeastbank.com.bd',
        color: '#1F618D',
        logo: '/providers/southeast-bank.svg',
    },
    {
        id: 'bank-asia',
        name: 'Bank Asia',
        accountType: 'Bank',
        domain: 'bankasia-bd.com',
        color: '#922B21',
        logo: '/providers/bank-asia.svg',
    },
    {
        id: 'nrb-bank',
        name: 'NRB Bank',
        accountType: 'Bank',
        domain: 'nrbbankbd.com',
        color: '#6C3483',
        logo: '/providers/nrb-bank.svg',
    },

    // Cards
    {
        id: 'visa',
        name: 'Visa',
        accountType: 'Credit',
        domain: 'visa.com',
        color: '#1A1F71',
        logo: '/providers/visa.svg',
    },
    {
        id: 'mastercard',
        name: 'Mastercard',
        accountType: 'Credit',
        domain: 'mastercard.com',
        color: '#EB001B',
        logo: '/providers/mastercard.svg',
    },
    {
        id: 'amex',
        name: 'American Express',
        accountType: 'Credit',
        domain: 'americanexpress.com',
        color: '#006FCF',
        logo: '/providers/amex.svg',
        aliases: ['amex'],
    },

    // Cash
    {
        id: 'cash',
        name: 'Cash',
        accountType: 'Cash',
        domain: '',
        color: '#2ECC71',
        logo: '/providers/cash.svg',
        aliases: ['cash in hand'],
    },
];

/** Live official logo from the provider domain (Clearbit). */
export function officialLogoUrl(domain: string): string | null {
    const host = domain?.trim();
    if (!host) return null;
    return `https://logo.clearbit.com/${host}`;
}

export function providersForType(type: AccountType): AccountProviderDef[] {
    return ACCOUNT_PROVIDERS.filter((p) => p.accountType === type);
}

export function findProviderById(id: string | null | undefined): AccountProviderDef | undefined {
    if (!id) return undefined;
    return ACCOUNT_PROVIDERS.find((p) => p.id === id);
}

/** Match a stored account name/provider/icon against the catalog. */
export function findProvider(account: {
    provider?: string | null;
    name?: string | null;
    icon?: string | null;
}): AccountProviderDef | undefined {
    const icon = account.icon?.trim() ?? '';
    if (icon.startsWith('/providers/')) {
        const byLogo = ACCOUNT_PROVIDERS.find((p) => p.logo === icon);
        if (byLogo) return byLogo;
    }

    const haystacks = [account.provider, account.name]
        .map((value) => value?.trim().toLowerCase())
        .filter((value): value is string => !!value);

    for (const provider of ACCOUNT_PROVIDERS) {
        const needles = [provider.name, provider.id.replace(/-/g, ' '), ...(provider.aliases ?? [])].map((n) =>
            n.toLowerCase(),
        );
        if (haystacks.some((hay) => needles.some((needle) => hay === needle || hay.includes(needle)))) {
            return provider;
        }
    }

    return undefined;
}

export function isLogoPath(icon: string | null | undefined): boolean {
    const value = icon?.trim() ?? '';
    return value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://');
}
