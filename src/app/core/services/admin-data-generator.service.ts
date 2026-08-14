import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AccountService } from './account.service';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';
import { PlanService } from './plan.service';
import { ToastService } from './toast.service';
import { CreateAccountRequest } from '../models/account.model';
import { CategoryType, CreateCategoryRequest } from '../models/category.model';
import { CreateTransactionRequest } from '../models/transaction.model';
import { CreatePlanRequest } from '../models/plan.model';

export interface DummyAccountDef extends CreateAccountRequest {
    key: string;
}

export interface DummyCategoryDef extends CreateCategoryRequest {
    key: string;
}

@Injectable({
    providedIn: 'root',
})
export class AdminDataGeneratorService {
    private accountService = inject(AccountService);
    private categoryService = inject(CategoryService);
    private transactionService = inject(TransactionService);
    private planService = inject(PlanService);
    private toastService = inject(ToastService);

    isGenerating = signal<boolean>(false);
    progressPercentage = signal<number>(0);
    currentStep = signal<string>('');
    logs = signal<string[]>([]);

    readonly defaultAccounts: DummyAccountDef[] = [
        {
            key: 'city_bank',
            name: 'City Bank Priority Checking',
            accountType: 'Bank',
            balance: 85000,
            currency: 'BDT',
            icon: '🏦',
            provider: 'City Bank',
            color: '#4F46E5',
        },
        {
            key: 'bkash',
            name: 'bKash Personal',
            accountType: 'MFS',
            balance: 14500,
            currency: 'BDT',
            icon: '📱',
            provider: 'bKash',
            color: '#E11D48',
        },
        {
            key: 'cash',
            name: 'Cash / Wallet',
            accountType: 'Cash',
            balance: 5200,
            currency: 'BDT',
            icon: '💵',
            provider: 'Physical Cash',
            color: '#10B981',
        },
        {
            key: 'amex',
            name: 'Amex Platinum Card',
            accountType: 'Credit',
            balance: 18500,
            currency: 'BDT',
            icon: '💳',
            provider: 'City Bank Amex',
            color: '#8B5CF6',
        },
    ];

    readonly defaultCategories: DummyCategoryDef[] = [
        // Income
        {
            key: 'salary',
            name: 'Monthly Salary',
            icon: '💼',
            color: '#10B981',
            type: CategoryType.Income,
            budgetLimit: 0,
        },
        {
            key: 'freelance',
            name: 'Freelance & Consulting',
            icon: '💻',
            color: '#06B6D4',
            type: CategoryType.Income,
            budgetLimit: 0,
        },
        {
            key: 'dividends',
            name: 'Investment Dividends',
            icon: '📈',
            color: '#3B82F6',
            type: CategoryType.Income,
            budgetLimit: 0,
        },
        // Expense
        {
            key: 'rent',
            name: 'Housing & Rent',
            icon: '🏠',
            color: '#F59E0B',
            type: CategoryType.Expense,
            budgetLimit: 35000,
        },
        {
            key: 'groceries',
            name: 'Groceries & Food',
            icon: '🛒',
            color: '#EC4899',
            type: CategoryType.Expense,
            budgetLimit: 20000,
        },
        {
            key: 'dining',
            name: 'Dining & Cafes',
            icon: '☕',
            color: '#F97316',
            type: CategoryType.Expense,
            budgetLimit: 8000,
        },
        {
            key: 'utilities',
            name: 'Utilities & Internet',
            icon: '⚡',
            color: '#6366F1',
            type: CategoryType.Expense,
            budgetLimit: 6000,
        },
        {
            key: 'health',
            name: 'Healthcare & Pharmacy',
            icon: '💊',
            color: '#EF4444',
            type: CategoryType.Expense,
            budgetLimit: 5000,
        },
        {
            key: 'entertainment',
            name: 'Entertainment & Subs',
            icon: '🎬',
            color: '#8B5CF6',
            type: CategoryType.Expense,
            budgetLimit: 4000,
        },
        {
            key: 'transport',
            name: 'Transportation & Fuel',
            icon: '🚗',
            color: '#14B8A6',
            type: CategoryType.Expense,
            budgetLimit: 7000,
        },
        {
            key: 'shopping',
            name: 'Shopping & Gadgets',
            icon: '🛍️',
            color: '#A855F7',
            type: CategoryType.Expense,
            budgetLimit: 15000,
        },
    ];

    readonly defaultPlans: CreatePlanRequest[] = [
        {
            title: 'Emergency Fund Reserve',
            targetAmount: 150000,
            currentAmount: 75000,
            color: '#10B981',
            deadline: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        },
        {
            title: 'MacBook Pro M3 Max Upgrade',
            targetAmount: 220000,
            currentAmount: 95000,
            color: '#6366F1',
            deadline: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
        },
        {
            title: 'Annual Holiday & Travel',
            targetAmount: 80000,
            currentAmount: 42000,
            color: '#F59E0B',
            deadline: new Date(Date.now() + 240 * 86400000).toISOString().split('T')[0],
        },
    ];

    clearLogs(): void {
        this.logs.set([]);
    }

    private addLog(message: string): void {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        this.logs.update((l) => [...l, `[${time}] ${message}`]);
    }

    /**
     * Seeds the complete financial ecosystem:
     * 1. 4 Accounts
     * 2. 11 Categories
     * 3. 40+ Transactions across 90 days
     * 4. 3 Savings Plans
     * 5. Refresh all reactive stores
     */
    async seedAll(): Promise<void> {
        if (this.isGenerating()) return;
        this.isGenerating.set(true);
        this.progressPercentage.set(5);
        this.currentStep.set('Starting complete financial seeding...');
        this.addLog('🚀 Initiating Full Financial Profile generation...');

        try {
            // 1. Seed Accounts
            this.currentStep.set('Seeding payment & banking accounts...');
            this.progressPercentage.set(15);
            const accountMap = await this.executeSeedAccounts();

            // 2. Seed Categories
            this.currentStep.set('Seeding income & expense categories...');
            this.progressPercentage.set(35);
            const categoryMap = await this.executeSeedCategories();

            // 3. Seed Transactions
            this.currentStep.set('Generating 40+ chronological transactions...');
            this.progressPercentage.set(55);
            await this.executeSeedTransactions(accountMap, categoryMap);

            // 4. Seed Plans
            this.currentStep.set('Seeding savings plans and goals...');
            this.progressPercentage.set(85);
            await this.executeSeedPlans();

            // 5. Refresh stores
            this.currentStep.set('Refreshing dashboard and store caches...');
            this.progressPercentage.set(95);
            await this.refreshAllStores();

            this.progressPercentage.set(100);
            this.currentStep.set('Complete! All demo data generated successfully.');
            this.addLog('✨ SUCCESS: Financial ecosystem populated completely.');
            this.toastService.show('Full demo financial profile populated successfully!');
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown generation error';
            this.addLog(`❌ ERROR: ${errorMsg}`);
            this.toastService.error(`Seeding failed: ${errorMsg}`);
        } finally {
            this.isGenerating.set(false);
        }
    }

    /**
     * Seed only Accounts
     */
    async seedAccountsOnly(): Promise<void> {
        if (this.isGenerating()) return;
        this.isGenerating.set(true);
        this.progressPercentage.set(20);
        this.currentStep.set('Seeding accounts...');
        this.addLog('💳 Creating Accounts...');

        try {
            await this.executeSeedAccounts();
            await firstValueFrom(this.accountService.getAccounts(true));
            this.progressPercentage.set(100);
            this.currentStep.set('Accounts seeded successfully.');
            this.addLog('✨ SUCCESS: Accounts created.');
            this.toastService.show('Accounts created successfully.');
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to seed accounts';
            this.addLog(`❌ ERROR: ${errorMsg}`);
            this.toastService.error(errorMsg);
        } finally {
            this.isGenerating.set(false);
        }
    }

    /**
     * Seed only Categories
     */
    async seedCategoriesOnly(): Promise<void> {
        if (this.isGenerating()) return;
        this.isGenerating.set(true);
        this.progressPercentage.set(20);
        this.currentStep.set('Seeding categories...');
        this.addLog('🏷️ Creating Categories...');

        try {
            await this.executeSeedCategories();
            await firstValueFrom(this.categoryService.getCategories());
            this.progressPercentage.set(100);
            this.currentStep.set('Categories seeded successfully.');
            this.addLog('✨ SUCCESS: Categories created.');
            this.toastService.show('Categories created successfully.');
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to seed categories';
            this.addLog(`❌ ERROR: ${errorMsg}`);
            this.toastService.error(errorMsg);
        } finally {
            this.isGenerating.set(false);
        }
    }

    /**
     * Seed only Transactions (resolves existing accounts/categories if needed)
     */
    async seedTransactionsOnly(): Promise<void> {
        if (this.isGenerating()) return;
        this.isGenerating.set(true);
        this.progressPercentage.set(20);
        this.currentStep.set('Preparing accounts and categories for transactions...');
        this.addLog('📝 Resolving active accounts and categories...');

        try {
            const accounts = await firstValueFrom(this.accountService.getAccounts(true));
            const categories = await firstValueFrom(this.categoryService.getCategories());

            let accountMap = new Map<string, string>();
            let categoryMap = new Map<string, string>();

            if (!accounts.items?.length) {
                this.addLog('⚠️ No accounts found. Auto-generating required accounts...');
                accountMap = await this.executeSeedAccounts();
            } else {
                accounts.items.forEach((a) => {
                    accountMap.set(a.name.toLowerCase(), a.id);
                    accountMap.set(a.accountType.toLowerCase(), a.id);
                });
            }

            if (!categories.length) {
                this.addLog('⚠️ No categories found. Auto-generating required categories...');
                categoryMap = await this.executeSeedCategories();
            } else {
                categories.forEach((c) => {
                    categoryMap.set(c.name.toLowerCase(), c.id);
                });
            }

            this.currentStep.set('Generating transactions batch...');
            this.progressPercentage.set(60);
            await this.executeSeedTransactions(accountMap, categoryMap);

            await firstValueFrom(this.transactionService.getTransactions());
            await firstValueFrom(this.accountService.getAccounts(true));

            this.progressPercentage.set(100);
            this.currentStep.set('Transactions seeded successfully.');
            this.addLog('✨ SUCCESS: Transactions generated.');
            this.toastService.show('40+ Transactions seeded successfully.');
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to seed transactions';
            this.addLog(`❌ ERROR: ${errorMsg}`);
            this.toastService.error(errorMsg);
        } finally {
            this.isGenerating.set(false);
        }
    }

    /**
     * Seed only Plans
     */
    async seedPlansOnly(): Promise<void> {
        if (this.isGenerating()) return;
        this.isGenerating.set(true);
        this.progressPercentage.set(30);
        this.currentStep.set('Seeding savings plans...');
        this.addLog('🎯 Creating Savings Plans...');

        try {
            await this.executeSeedPlans();
            await firstValueFrom(this.planService.getPlans());
            this.progressPercentage.set(100);
            this.currentStep.set('Savings plans seeded successfully.');
            this.addLog('✨ SUCCESS: Savings plans created.');
            this.toastService.show('Savings plans created successfully.');
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to seed plans';
            this.addLog(`❌ ERROR: ${errorMsg}`);
            this.toastService.error(errorMsg);
        } finally {
            this.isGenerating.set(false);
        }
    }

    // ==========================================
    // Internal Seeding Execution Helpers
    // ==========================================

    private async executeSeedAccounts(): Promise<Map<string, string>> {
        const accountMap = new Map<string, string>();
        for (const def of this.defaultAccounts) {
            const { key, ...req } = def;
            this.addLog(`Creating Account: ${req.name} (${req.accountType})...`);
            const id = await firstValueFrom(this.accountService.createAccount(req));
            accountMap.set(key, id);
            accountMap.set(req.name.toLowerCase(), id);
            accountMap.set(req.accountType.toLowerCase(), id);
            this.addLog(`  ↳ Created Account ID: ${id}`);
        }
        return accountMap;
    }

    private async executeSeedCategories(): Promise<Map<string, string>> {
        const categoryMap = new Map<string, string>();
        for (const def of this.defaultCategories) {
            const { key, ...req } = def;
            this.addLog(`Creating Category: ${req.name} (${req.type === CategoryType.Income ? 'Income' : 'Expense'})...`);
            const id = await firstValueFrom(this.categoryService.createCategory(req));
            categoryMap.set(key, id);
            categoryMap.set(req.name.toLowerCase(), id);
            this.addLog(`  ↳ Created Category ID: ${id}`);
        }
        return categoryMap;
    }

    private async executeSeedPlans(): Promise<void> {
        for (const req of this.defaultPlans) {
            this.addLog(`Creating Savings Plan: ${req.title}...`);
            const id = await firstValueFrom(this.planService.createPlan(req));
            this.addLog(`  ↳ Created Plan ID: ${id}`);
        }
    }

    private async executeSeedTransactions(
        accountMap: Map<string, string>,
        categoryMap: Map<string, string>,
    ): Promise<void> {
        const txDefinitions = this.buildTransactionTemplates();
        const total = txDefinitions.length;
        let count = 0;

        for (const def of txDefinitions) {
            // Resolve Account ID
            let accountId = accountMap.get(def.accountKey) || accountMap.get(def.fallbackAccountType || '');
            if (!accountId) {
                // Fallback to first available account in map
                accountId = Array.from(accountMap.values())[0];
            }

            // Resolve Category ID
            let categoryId = categoryMap.get(def.categoryKey);
            if (!categoryId) {
                categoryId = Array.from(categoryMap.values())[0];
            }

            if (!accountId || !categoryId) {
                continue;
            }

            const req: CreateTransactionRequest = {
                title: def.title,
                amount: def.amount,
                type: def.type,
                categoryId,
                accountId,
                date: def.date,
                time: def.time || '12:00',
                paymentMethod: def.paymentMethod,
                tags: def.tags,
                note: def.note,
                timeZoneOffsetInMinutes: -new Date().getTimezoneOffset(),
            };

            await firstValueFrom(this.transactionService.createTransaction(req));
            count++;
            if (count % 8 === 0 || count === total) {
                this.addLog(`  ↳ Seeded ${count}/${total} transactions...`);
            }
        }
    }

    private async refreshAllStores(): Promise<void> {
        await Promise.allSettled([
            firstValueFrom(this.accountService.getAccounts(true)),
            firstValueFrom(this.categoryService.getCategories()),
            firstValueFrom(this.transactionService.getTransactions()),
            firstValueFrom(this.planService.getPlans()),
        ]);
    }

    /**
     * Builds 45+ realistic financial transactions spanning the last 90 days.
     */
    private buildTransactionTemplates(): Array<{
        title: string;
        amount: number;
        type: CategoryType;
        categoryKey: string;
        accountKey: string;
        fallbackAccountType?: string;
        date: string;
        time?: string;
        paymentMethod: string;
        tags?: string;
        note?: string;
    }> {
        const today = new Date();
        const daysAgo = (d: number): string => {
            const dt = new Date(today);
            dt.setDate(dt.getDate() - d);
            return dt.toISOString().split('T')[0];
        };

        return [
            // Month -3 (~75-90 days ago)
            {
                title: 'TechCorp Monthly Salary',
                amount: 95000,
                type: CategoryType.Income,
                categoryKey: 'salary',
                accountKey: 'city_bank',
                date: daysAgo(88),
                time: '10:00',
                paymentMethod: 'Bank Transfer',
                tags: 'salary,income,techcorp',
                note: 'Monthly base salary credited',
            },
            {
                title: 'Apartment Monthly Rent',
                amount: 28000,
                type: CategoryType.Expense,
                categoryKey: 'rent',
                accountKey: 'city_bank',
                date: daysAgo(85),
                time: '11:30',
                paymentMethod: 'Online Banking',
                tags: 'housing,rent,fixed',
                note: 'Gulshan 2 apartment rent payment',
            },
            {
                title: 'Agora Superstore Grocery Run',
                amount: 4650,
                type: CategoryType.Expense,
                categoryKey: 'groceries',
                accountKey: 'amex',
                date: daysAgo(82),
                time: '18:45',
                paymentMethod: 'Credit Card',
                tags: 'groceries,agora,food',
                note: 'Weekly provisions, vegetables and staples',
            },
            {
                title: 'North End Coffee Roasters',
                amount: 720,
                type: CategoryType.Expense,
                categoryKey: 'dining',
                accountKey: 'bkash',
                date: daysAgo(80),
                time: '16:15',
                paymentMethod: 'bKash QR',
                tags: 'coffee,dining,weekend',
                note: 'Cold brew and brownie with colleagues',
            },
            {
                title: 'Uber Rides to Office',
                amount: 680,
                type: CategoryType.Expense,
                categoryKey: 'transport',
                accountKey: 'bkash',
                date: daysAgo(77),
                time: '09:10',
                paymentMethod: 'bKash Auto',
                tags: 'commute,uber,transport',
                note: 'Rush hour commute',
            },
            {
                title: 'Fiber Internet Subscription',
                amount: 1750,
                type: CategoryType.Expense,
                categoryKey: 'utilities',
                accountKey: 'bkash',
                date: daysAgo(75),
                time: '14:20',
                paymentMethod: 'bKash Pay',
                tags: 'internet,utility,monthly',
                note: '100Mbps dedicated connection',
            },
            {
                title: 'Lazz Pharma Prescription',
                amount: 1450,
                type: CategoryType.Expense,
                categoryKey: 'health',
                accountKey: 'cash',
                date: daysAgo(73),
                time: '20:00',
                paymentMethod: 'Cash',
                tags: 'pharmacy,health,medicines',
                note: 'Vitamins and routine prescriptions',
            },
            {
                title: 'Netflix & Spotify Family Plans',
                amount: 1950,
                type: CategoryType.Expense,
                categoryKey: 'entertainment',
                accountKey: 'amex',
                date: daysAgo(71),
                time: '00:01',
                paymentMethod: 'Credit Card',
                tags: 'subscriptions,entertainment,recurring',
                note: 'Digital entertainment services',
            },
            {
                title: 'Freelance UI/UX Mobile App Design',
                amount: 32000,
                type: CategoryType.Income,
                categoryKey: 'freelance',
                accountKey: 'city_bank',
                date: daysAgo(68),
                time: '15:30',
                paymentMethod: 'Wire Transfer',
                tags: 'freelance,design,client',
                note: 'Milestone 2 payout from fintech client',
            },
            {
                title: 'Unimart Weekly Provisions',
                amount: 5800,
                type: CategoryType.Expense,
                categoryKey: 'groceries',
                accountKey: 'amex',
                date: daysAgo(65),
                time: '19:15',
                paymentMethod: 'Credit Card',
                tags: 'groceries,unimart,household',
                note: 'Household cleaning supplies and groceries',
            },
            {
                title: 'Woodland Footwear & Apparel',
                amount: 4800,
                type: CategoryType.Expense,
                categoryKey: 'shopping',
                accountKey: 'amex',
                date: daysAgo(63),
                time: '17:40',
                paymentMethod: 'Credit Card',
                tags: 'shopping,clothing,lifestyle',
                note: 'New shoes for work and commute',
            },

            // Month -2 (~35-60 days ago)
            {
                title: 'TechCorp Monthly Salary',
                amount: 95000,
                type: CategoryType.Income,
                categoryKey: 'salary',
                accountKey: 'city_bank',
                date: daysAgo(58),
                time: '10:00',
                paymentMethod: 'Bank Transfer',
                tags: 'salary,income,techcorp',
                note: 'Regular salary disbursement',
            },
            {
                title: 'Apartment Monthly Rent',
                amount: 28000,
                type: CategoryType.Expense,
                categoryKey: 'rent',
                accountKey: 'city_bank',
                date: daysAgo(55),
                time: '11:00',
                paymentMethod: 'Online Banking',
                tags: 'housing,rent,fixed',
                note: 'Monthly rental fee',
            },
            {
                title: 'DESCO Electricity Bill',
                amount: 2450,
                type: CategoryType.Expense,
                categoryKey: 'utilities',
                accountKey: 'bkash',
                date: daysAgo(52),
                time: '12:15',
                paymentMethod: 'bKash Pay',
                tags: 'electricity,bills,utility',
                note: 'Summer air conditioning power bill',
            },
            {
                title: 'Shwapno Super Shop',
                amount: 3950,
                type: CategoryType.Expense,
                categoryKey: 'groceries',
                accountKey: 'bkash',
                date: daysAgo(49),
                time: '19:30',
                paymentMethod: 'bKash QR',
                tags: 'groceries,shwapno,food',
                note: 'Fresh dairy, fruits, poultry',
            },
            {
                title: 'Secret Recipe Dinner',
                amount: 2200,
                type: CategoryType.Expense,
                categoryKey: 'dining',
                accountKey: 'amex',
                date: daysAgo(46),
                time: '20:45',
                paymentMethod: 'Credit Card',
                tags: 'dining,dinner,family',
                note: 'Weekend family dinner',
            },
            {
                title: 'Octane Refuel for Car',
                amount: 3500,
                type: CategoryType.Expense,
                categoryKey: 'transport',
                accountKey: 'city_bank',
                date: daysAgo(44),
                time: '08:30',
                paymentMethod: 'Debit Card',
                tags: 'fuel,car,transport',
                note: 'Full tank at Trust Filling Station',
            },
            {
                title: 'Stock Portfolio Dividend Payout',
                amount: 8500,
                type: CategoryType.Income,
                categoryKey: 'dividends',
                accountKey: 'city_bank',
                date: daysAgo(42),
                time: '14:00',
                paymentMethod: 'BEFTN Dividend',
                tags: 'investment,dividend,passive',
                note: 'Beximco Pharma Q2 dividend',
            },
            {
                title: 'Star Cineplex Movie Night & Snacks',
                amount: 1600,
                type: CategoryType.Expense,
                categoryKey: 'entertainment',
                accountKey: 'bkash',
                date: daysAgo(39),
                time: '21:00',
                paymentMethod: 'bKash Online',
                tags: 'movies,cineplex,entertainment',
                note: 'IMAX Tickets and Popcorn Combo',
            },
            {
                title: 'Agora Weekly Grocery Top-up',
                amount: 3400,
                type: CategoryType.Expense,
                categoryKey: 'groceries',
                accountKey: 'cash',
                date: daysAgo(36),
                time: '18:00',
                paymentMethod: 'Cash',
                tags: 'groceries,market,cooking',
                note: 'Vegetables, spices, snacks',
            },
            {
                title: 'Dental Checkup & Cleaning',
                amount: 2500,
                type: CategoryType.Expense,
                categoryKey: 'health',
                accountKey: 'city_bank',
                date: daysAgo(33),
                time: '16:00',
                paymentMethod: 'Debit Card',
                tags: 'dentist,health,clinic',
                note: 'Biannual dental hygiene checkup',
            },

            // Month -1 & Recent (0-30 days ago)
            {
                title: 'TechCorp Monthly Salary',
                amount: 95000,
                type: CategoryType.Income,
                categoryKey: 'salary',
                accountKey: 'city_bank',
                date: daysAgo(28),
                time: '10:00',
                paymentMethod: 'Bank Transfer',
                tags: 'salary,income,techcorp',
                note: 'Latest base salary deposit',
            },
            {
                title: 'Apartment Monthly Rent',
                amount: 28000,
                type: CategoryType.Expense,
                categoryKey: 'rent',
                accountKey: 'city_bank',
                date: daysAgo(25),
                time: '11:00',
                paymentMethod: 'Online Banking',
                tags: 'housing,rent,fixed',
                note: 'Monthly rental fee',
            },
            {
                title: 'Unimart Premium Groceries',
                amount: 6200,
                type: CategoryType.Expense,
                categoryKey: 'groceries',
                accountKey: 'amex',
                date: daysAgo(22),
                time: '19:10',
                paymentMethod: 'Credit Card',
                tags: 'groceries,unimart,premium',
                note: 'Imported ingredients and monthly pantry refill',
            },
            {
                title: 'Titas Gas & Water WASA Bills',
                amount: 1850,
                type: CategoryType.Expense,
                categoryKey: 'utilities',
                accountKey: 'bkash',
                date: daysAgo(20),
                time: '13:00',
                paymentMethod: 'bKash Pay',
                tags: 'utility,bills,wasa',
                note: 'Utility bill bundle payment',
            },
            {
                title: 'Freelance API Architecture Audit',
                amount: 45000,
                type: CategoryType.Income,
                categoryKey: 'freelance',
                accountKey: 'city_bank',
                date: daysAgo(18),
                time: '16:30',
                paymentMethod: 'Wire Transfer',
                tags: 'freelance,consulting,api',
                note: 'Payment for backend security & perf audit',
            },
            {
                title: 'Crimson Cup Cafe & Pastries',
                amount: 920,
                type: CategoryType.Expense,
                categoryKey: 'dining',
                accountKey: 'bkash',
                date: daysAgo(15),
                time: '17:20',
                paymentMethod: 'bKash QR',
                tags: 'cafe,coffee,dining',
                note: 'Afternoon coffee break with friends',
            },
            {
                title: 'Mechanical Keyboard & Desk Mat',
                amount: 7500,
                type: CategoryType.Expense,
                categoryKey: 'shopping',
                accountKey: 'amex',
                date: daysAgo(12),
                time: '14:15',
                paymentMethod: 'Credit Card',
                tags: 'gadgets,tech,workspace',
                note: 'Custom wireless mechanical keyboard',
            },
            {
                title: 'Uber Rides (Weekly Package)',
                amount: 1450,
                type: CategoryType.Expense,
                categoryKey: 'transport',
                accountKey: 'bkash',
                date: daysAgo(9),
                time: '19:00',
                paymentMethod: 'bKash Auto',
                tags: 'uber,commute,transport',
                note: 'Work commute across the week',
            },
            {
                title: 'Weekly Vegetables & Farmers Market',
                amount: 1850,
                type: CategoryType.Expense,
                categoryKey: 'groceries',
                accountKey: 'cash',
                date: daysAgo(6),
                time: '08:30',
                paymentMethod: 'Cash',
                tags: 'groceries,cash,fresh',
                note: 'Fresh market bazaar shopping',
            },
            {
                title: 'Spotify & ChatGPT Plus Subscription',
                amount: 2750,
                type: CategoryType.Expense,
                categoryKey: 'entertainment',
                accountKey: 'amex',
                date: daysAgo(4),
                time: '03:15',
                paymentMethod: 'Credit Card',
                tags: 'subscriptions,ai,tech',
                note: 'Productivity and music subscription',
            },
            {
                title: 'Madchef Gourmet Burgers',
                amount: 1350,
                type: CategoryType.Expense,
                categoryKey: 'dining',
                accountKey: 'bkash',
                date: daysAgo(2),
                time: '20:30',
                paymentMethod: 'bKash QR',
                tags: 'dining,burgers,food',
                note: 'Comfort dinner takeaway',
            },
            {
                title: 'Pharmacy Vitamins & Supplements',
                amount: 980,
                type: CategoryType.Expense,
                categoryKey: 'health',
                accountKey: 'cash',
                date: daysAgo(1),
                time: '15:10',
                paymentMethod: 'Cash',
                tags: 'health,pharmacy,wellness',
                note: 'Daily multivitamin pack',
            },
        ];
    }
}
