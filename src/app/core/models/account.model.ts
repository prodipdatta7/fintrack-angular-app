export type AccountType = 'Bank' | 'MFS' | 'Cash' | 'Credit';

export interface Account {
    id: string;
    name: string;
    accountType: AccountType;
    balance: number;
    currency: string;
    /** Emoji glyph or logo path, e.g. "🏦" or "/providers/bkash.svg". */
    icon: string;
    /** Human label for the provider, e.g. "City Bank / Chase". */
    provider: string;
    /** Hex color driving the portfolio-share bar. */
    color: string;
    isClosed: boolean;
    /** Serves as the "Date Added" shown on the account detail header. */
    createdAt: string;
}

export interface AccountListResult {
    items: Account[];
    totalBalance: number;
}

export interface CreateAccountRequest {
    name: string;
    accountType: AccountType;
    balance: number;
    currency: string;
    icon: string;
    provider: string;
    color: string;
}

/** Balance is deliberately absent — it changes only via the inline PATCH /balance flow. */
export interface UpdateAccountRequest extends Omit<CreateAccountRequest, 'balance'> {
    id: string;
}

export interface UpdateBalanceRequest {
    balance: number;
}
