import { Transaction } from './transaction.model';

export type Timeframe =
    | '7D'
    | '15D'
    | '30D'
    | '60D'
    | '6M'
    | '1Y'
    | 'This Month'
    | 'This Year'
    | 'All'
    | 'Custom';

export const TIMEFRAMES: Timeframe[] = [
    '7D',
    '15D',
    '30D',
    '60D',
    '6M',
    '1Y',
    'This Month',
    'This Year',
    'All',
    'Custom',
];

export interface CategorySpend {
    categoryId: string;
    spent: number;
}

export interface DashboardSummary {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    categorySpent: CategorySpend[];
    recentTransactions: Transaction[];
    /** Number of ledger entries in scope — drives the account detail "Processed Ledgers" tile. */
    transactionCount: number;
}

export interface CashflowPoint {
    label: string;
    income: number;
    expense: number;
}

export interface SummaryQuery {
    from?: string;
    to?: string;
    accountId?: string;
    timeframe?: Timeframe;
}

export interface CashflowQuery {
    from?: string;
    to?: string;
    accountId?: string;
}
