import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AccountService } from './account.service';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';
import { PlanService } from './plan.service';
import { ToastService } from './toast.service';
import { Account, CreateAccountRequest } from '../models/account.model';
import { Category, CategoryType, CreateCategoryRequest } from '../models/category.model';
import { CreateTransactionRequest } from '../models/transaction.model';
import { CreatePlanRequest, SavingsPlan } from '../models/plan.model';

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
    /**
     * Seeds the complete financial ecosystem:
     * 1. 4 Accounts
     * 2. 11 Categories
     * 3. 44 Chronological Transactions (4 per category uniformly)
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
            await this.executeSeedAccounts();
            const accountsRes = await firstValueFrom(this.accountService.getAccounts(true));
            const accounts = accountsRes.items || [];
            const accountMap = this.buildAccountLookupMap(accounts);

            // 2. Seed Categories
            this.currentStep.set('Seeding income & expense categories...');
            this.progressPercentage.set(35);
            await this.executeSeedCategories();
            const categories = await firstValueFrom(this.categoryService.getCategories());
            const categoryMap = this.buildCategoryLookupMap(categories);

            // 3. Seed Transactions
            this.currentStep.set('Generating 44 uniform multi-category transactions...');
            this.progressPercentage.set(55);
            await this.executeSeedTransactions(accountMap, categoryMap, accounts, categories);

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
            this.addLog('✨ SUCCESS: Financial ecosystem populated completely with uniform category distribution.');
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
            let accountsRes = await firstValueFrom(this.accountService.getAccounts(true));
            let categories = await firstValueFrom(this.categoryService.getCategories());

            if (!accountsRes.items?.length) {
                this.addLog('⚠️ No accounts found. Auto-generating default accounts...');
                await this.executeSeedAccounts();
                accountsRes = await firstValueFrom(this.accountService.getAccounts(true));
            }
            const accounts = accountsRes.items || [];
            const accountMap = this.buildAccountLookupMap(accounts);

            if (!categories.length) {
                this.addLog('⚠️ No categories found. Auto-generating default categories...');
                await this.executeSeedCategories();
                categories = await firstValueFrom(this.categoryService.getCategories());
            }
            const categoryMap = this.buildCategoryLookupMap(categories);

            this.currentStep.set('Generating 44 uniform multi-category transactions...');
            this.progressPercentage.set(60);
            await this.executeSeedTransactions(accountMap, categoryMap, accounts, categories);

            await firstValueFrom(this.transactionService.getTransactions());
            await firstValueFrom(this.accountService.getAccounts(true));

            this.progressPercentage.set(100);
            this.currentStep.set('Transactions seeded successfully.');
            this.addLog('✨ SUCCESS: Transactions generated with uniform category distribution.');
            this.toastService.show('44 Transactions seeded uniformly across all categories.');
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

    private async executeSeedAccounts(): Promise<void> {
        const existing = await firstValueFrom(this.accountService.getAccounts(true)).catch(() => ({ items: [] }));
        const existingNames = new Set((existing.items || []).map((a) => (a.name || '').toLowerCase().trim()));

        for (const def of this.defaultAccounts) {
            const { key, ...req } = def;
            const normalized = (req.name || '').toLowerCase().trim();
            if (existingNames.has(normalized)) {
                this.addLog(`⏭️ Account "${req.name}" already exists. Skipping...`);
                continue;
            }
            this.addLog(`Creating Account: ${req.name} (${req.accountType})...`);
            try {
                const id = await firstValueFrom(this.accountService.createAccount(req));
                this.addLog(`  ↳ Created Account ID: ${id}`);
                existingNames.add(normalized);
            } catch (err: unknown) {
                const errorMsg = (err as { error?: { message?: string } })?.error?.message || (err as Error)?.message || '';
                this.addLog(`⏭️ Account "${req.name}" could not be created (${errorMsg || 'already exists'}). Skipping...`);
                existingNames.add(normalized);
            }
        }
    }

    private async executeSeedCategories(): Promise<void> {
        const existing = await firstValueFrom(this.categoryService.getCategories()).catch(() => [] as Category[]);
        const existingNames = new Set(existing.map((c) => (c.name || '').toLowerCase().trim()));

        for (const def of this.defaultCategories) {
            const { key, ...req } = def;
            const normalized = (req.name || '').toLowerCase().trim();
            if (existingNames.has(normalized)) {
                this.addLog(`⏭️ Category "${req.name}" already exists. Skipping...`);
                continue;
            }
            this.addLog(`Creating Category: ${req.name} (${req.type === CategoryType.Income ? 'Income' : 'Expense'})...`);
            try {
                const id = await firstValueFrom(this.categoryService.createCategory(req));
                this.addLog(`  ↳ Created Category ID: ${id}`);
                existingNames.add(normalized);
            } catch (err: unknown) {
                const errorMsg = (err as { error?: { message?: string } })?.error?.message || (err as Error)?.message || '';
                this.addLog(`⏭️ Category "${req.name}" could not be created (${errorMsg || 'already exists'}). Skipping...`);
                existingNames.add(normalized);
            }
        }
    }

    private async executeSeedPlans(): Promise<void> {
        const existing = await firstValueFrom(this.planService.getPlans()).catch(() => [] as SavingsPlan[]);
        const existingTitles = new Set(existing.map((p) => (p.title || '').toLowerCase().trim()));

        for (const req of this.defaultPlans) {
            const normalized = (req.title || '').toLowerCase().trim();
            if (existingTitles.has(normalized)) {
                this.addLog(`⏭️ Savings Plan "${req.title}" already exists. Skipping...`);
                continue;
            }
            this.addLog(`Creating Savings Plan: ${req.title}...`);
            try {
                const id = await firstValueFrom(this.planService.createPlan(req));
                this.addLog(`  ↳ Created Plan ID: ${id}`);
                existingTitles.add(normalized);
            } catch (err: unknown) {
                const errorMsg = (err as { error?: { message?: string } })?.error?.message || (err as Error)?.message || '';
                this.addLog(`⏭️ Savings Plan "${req.title}" could not be created (${errorMsg || 'already exists'}). Skipping...`);
                existingTitles.add(normalized);
            }
        }
    }

    private normalizeString(s: string): string {
        return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    private buildAccountLookupMap(accounts: Account[]): Map<string, string> {
        const map = new Map<string, string>();
        for (const acc of accounts) {
            const rawName = acc.name.toLowerCase();
            const cleanName = this.normalizeString(acc.name);
            const type = (acc.accountType || '').toLowerCase();

            map.set(acc.id, acc.id);
            map.set(rawName, acc.id);
            map.set(cleanName, acc.id);
            map.set(type, acc.id);

            if (type === 'bank' || rawName.includes('bank') || rawName.includes('priority') || rawName.includes('check')) {
                map.set('city_bank', acc.id);
                map.set('bank', acc.id);
            }
            if (type === 'mfs' || rawName.includes('bkash') || rawName.includes('nagad') || rawName.includes('mobile')) {
                map.set('bkash', acc.id);
                map.set('mfs', acc.id);
            }
            if (type === 'cash' || rawName.includes('cash') || rawName.includes('wallet')) {
                map.set('cash', acc.id);
            }
            if (type === 'credit' || rawName.includes('amex') || rawName.includes('card') || rawName.includes('credit')) {
                map.set('amex', acc.id);
                map.set('credit', acc.id);
            }
        }
        return map;
    }

    private buildCategoryLookupMap(categories: Category[]): Map<string, string> {
        const map = new Map<string, string>();
        for (const cat of categories) {
            const rawName = cat.name.toLowerCase();
            const cleanName = this.normalizeString(cat.name);

            map.set(cat.id, cat.id);
            map.set(rawName, cat.id);
            map.set(cleanName, cat.id);

            // Comprehensive keyword & alias mappings
            if (rawName.includes('salar') || rawName.includes('wage') || rawName.includes('paycheck')) {
                map.set('salary', cat.id);
                map.set('monthly salary', cat.id);
            }
            if (rawName.includes('freelanc') || rawName.includes('consult') || rawName.includes('contract')) {
                map.set('freelance', cat.id);
                map.set('freelance & consulting', cat.id);
            }
            if (rawName.includes('divid') || rawName.includes('invest') || rawName.includes('stock') || rawName.includes('profit')) {
                map.set('dividends', cat.id);
                map.set('investment dividends', cat.id);
            }
            if (rawName.includes('rent') || rawName.includes('hous') || rawName.includes('apart') || rawName.includes('home')) {
                map.set('rent', cat.id);
                map.set('housing & rent', cat.id);
            }
            if (rawName.includes('groc') || rawName.includes('food') || rawName.includes('market') || rawName.includes('super')) {
                map.set('groceries', cat.id);
                map.set('groceries & food', cat.id);
            }
            if (rawName.includes('din') || rawName.includes('cafe') || rawName.includes('restaur') || rawName.includes('coffee') || rawName.includes('eat')) {
                map.set('dining', cat.id);
                map.set('dining & cafes', cat.id);
            }
            if (rawName.includes('util') || rawName.includes('internet') || rawName.includes('electr') || rawName.includes('bill') || rawName.includes('gas') || rawName.includes('water')) {
                map.set('utilities', cat.id);
                map.set('utilities & internet', cat.id);
            }
            if (rawName.includes('health') || rawName.includes('pharm') || rawName.includes('medic') || rawName.includes('dent') || rawName.includes('clinic')) {
                map.set('health', cat.id);
                map.set('healthcare & pharmacy', cat.id);
            }
            if (rawName.includes('entert') || rawName.includes('sub') || rawName.includes('movi') || rawName.includes('game') || rawName.includes('stream') || rawName.includes('music')) {
                map.set('entertainment', cat.id);
                map.set('entertainment & subs', cat.id);
            }
            if (rawName.includes('trans') || rawName.includes('fuel') || rawName.includes('uber') || rawName.includes('car') || rawName.includes('commute') || rawName.includes('cng')) {
                map.set('transport', cat.id);
                map.set('transportation & fuel', cat.id);
            }
            if (rawName.includes('shop') || rawName.includes('gadg') || rawName.includes('cloth') || rawName.includes('apparel') || rawName.includes('retail')) {
                map.set('shopping', cat.id);
                map.set('shopping & gadgets', cat.id);
            }
        }
        return map;
    }

    private async executeSeedTransactions(
        accountMap: Map<string, string>,
        categoryMap: Map<string, string>,
        allAccounts: Account[],
        allCategories: Category[],
    ): Promise<void> {
        const txDefinitions = this.buildTransactionTemplates();
        const total = txDefinitions.length;
        let count = 0;

        const incomeCategoryIds = allCategories.filter((c) => c.type === CategoryType.Income).map((c) => c.id);
        const expenseCategoryIds = allCategories.filter((c) => c.type === CategoryType.Expense).map((c) => c.id);
        const allCategoryIds = allCategories.map((c) => c.id);
        const allAccountIds = allAccounts.map((a) => a.id);

        let incomeFallbackIdx = 0;
        let expenseFallbackIdx = 0;
        let accountFallbackIdx = 0;

        for (const def of txDefinitions) {
            // 1. Resolve Category ID accurately
            let categoryId =
                categoryMap.get(def.categoryKey) ||
                categoryMap.get(def.categoryKey.toLowerCase()) ||
                categoryMap.get(this.normalizeString(def.categoryKey));

            // Uniform round-robin fallback if category key is not matched
            if (!categoryId) {
                if (def.type === CategoryType.Income && incomeCategoryIds.length > 0) {
                    categoryId = incomeCategoryIds[incomeFallbackIdx % incomeCategoryIds.length];
                    incomeFallbackIdx++;
                } else if (def.type === CategoryType.Expense && expenseCategoryIds.length > 0) {
                    categoryId = expenseCategoryIds[expenseFallbackIdx % expenseCategoryIds.length];
                    expenseFallbackIdx++;
                } else if (allCategoryIds.length > 0) {
                    categoryId = allCategoryIds[(incomeFallbackIdx + expenseFallbackIdx) % allCategoryIds.length];
                }
            }

            // 2. Resolve Account ID accurately
            let accountId =
                accountMap.get(def.accountKey) ||
                accountMap.get(def.fallbackAccountType || '') ||
                accountMap.get(this.normalizeString(def.accountKey));

            if (!accountId && allAccountIds.length > 0) {
                accountId = allAccountIds[accountFallbackIdx % allAccountIds.length];
                accountFallbackIdx++;
            }

            if (!accountId || !categoryId) {
                this.addLog(`  ⚠️ Skipping "${def.title}": could not resolve account/category ID.`);
                continue;
            }

            const catIdStr = typeof categoryId === 'string' ? categoryId : ((categoryId as any)?.id || (categoryId as any)?.categoryId || String(categoryId));
            const accIdStr = typeof accountId === 'string' ? accountId : ((accountId as any)?.id || (accountId as any)?.accountId || String(accountId));

            const timePart = def.time || '12:00';
            let dateIso: string;
            try {
                const fullTime = timePart.length === 5 ? `${timePart}:00` : timePart;
                dateIso = new Date(`${def.date}T${fullTime}`).toISOString();
            } catch {
                dateIso = new Date().toISOString();
            }

            const req: CreateTransactionRequest = {
                title: def.title,
                amount: Number(def.amount),
                type: Number(def.type),
                categoryId: catIdStr,
                accountId: accIdStr,
                date: dateIso,
                time: timePart,
                paymentMethod: def.paymentMethod || 'Cash',
                receiptFileName: '',
                receiptUrl: '',
                tags: def.tags || '',
                note: def.note || '',
                attachments: [],
                timeZoneOffsetInMinutes: new Date().getTimezoneOffset(),
            };

            try {
                await firstValueFrom(this.transactionService.createTransaction(req));
                count++;
                if (count % 11 === 0 || count === total) {
                    this.addLog(`  ↳ Seeded ${count}/${total} transactions...`);
                }
            } catch (txErr: unknown) {
                const msg = txErr instanceof Error ? txErr.message : (txErr as any)?.error?.error || 'Transaction API error';
                this.addLog(`  ⚠️ Failed to seed transaction "${def.title}": ${msg}`);
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
            // Cycle 1: Month -3 (70 to 90 days ago) — 1 transaction per category
            {
                title: 'TechCorp Base Salary',
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
                title: 'Apartment Monthly Rent & Service',
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
                title: 'Agora Superstore Grocery Provisions',
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
                title: 'Beximco Pharma Q1 Stock Dividend',
                amount: 7500,
                type: CategoryType.Income,
                categoryKey: 'dividends',
                accountKey: 'city_bank',
                date: daysAgo(80),
                time: '14:00',
                paymentMethod: 'BEFTN Dividend',
                tags: 'investment,dividend,stocks',
                note: 'Quarterly dividend payment',
            },
            {
                title: 'North End Coffee Roasters & Pastry',
                amount: 850,
                type: CategoryType.Expense,
                categoryKey: 'dining',
                accountKey: 'bkash',
                date: daysAgo(78),
                time: '16:15',
                paymentMethod: 'bKash QR',
                tags: 'coffee,dining,weekend',
                note: 'Cold brew and brownie with colleagues',
            },
            {
                title: 'High-Speed Fiber Internet Bill',
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
                title: 'Fintech Mobile App UI/UX Milestone',
                amount: 32000,
                type: CategoryType.Income,
                categoryKey: 'freelance',
                accountKey: 'city_bank',
                date: daysAgo(72),
                time: '15:30',
                paymentMethod: 'Wire Transfer',
                tags: 'freelance,design,client',
                note: 'Milestone payout from fintech client',
            },
            {
                title: 'Lazz Pharma Prescription Medicines',
                amount: 1450,
                type: CategoryType.Expense,
                categoryKey: 'health',
                accountKey: 'cash',
                date: daysAgo(70),
                time: '20:00',
                paymentMethod: 'Cash',
                tags: 'pharmacy,health,medicines',
                note: 'Vitamins and routine prescriptions',
            },
            {
                title: 'Netflix & Spotify Family Subscriptions',
                amount: 1950,
                type: CategoryType.Expense,
                categoryKey: 'entertainment',
                accountKey: 'amex',
                date: daysAgo(67),
                time: '00:01',
                paymentMethod: 'Credit Card',
                tags: 'subscriptions,entertainment,recurring',
                note: 'Digital streaming entertainment services',
            },
            {
                title: 'Uber Rides Work Commute (Week 1)',
                amount: 950,
                type: CategoryType.Expense,
                categoryKey: 'transport',
                accountKey: 'bkash',
                date: daysAgo(64),
                time: '09:10',
                paymentMethod: 'bKash Auto',
                tags: 'commute,uber,transport',
                note: 'Work commute across the week',
            },
            {
                title: 'Woodland Footwear & Work Apparel',
                amount: 4800,
                type: CategoryType.Expense,
                categoryKey: 'shopping',
                accountKey: 'amex',
                date: daysAgo(60),
                time: '17:40',
                paymentMethod: 'Credit Card',
                tags: 'shopping,clothing,lifestyle',
                note: 'New shoes for work and commute',
            },

            // Cycle 2: Month -2 (35 to 60 days ago) — 1 transaction per category
            {
                title: 'TechCorp Base Salary',
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
                title: 'Apartment Monthly Rent & Service',
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
                title: 'Unimart Household Supplies & Grocery',
                amount: 5800,
                type: CategoryType.Expense,
                categoryKey: 'groceries',
                accountKey: 'amex',
                date: daysAgo(53),
                time: '19:15',
                paymentMethod: 'Credit Card',
                tags: 'groceries,unimart,household',
                note: 'Household cleaning supplies and groceries',
            },
            {
                title: 'Grameenphone Half-Yearly Dividend',
                amount: 8500,
                type: CategoryType.Income,
                categoryKey: 'dividends',
                accountKey: 'city_bank',
                date: daysAgo(50),
                time: '14:00',
                paymentMethod: 'BEFTN Dividend',
                tags: 'investment,dividend,stocks',
                note: 'Half-yearly dividend credited',
            },
            {
                title: 'Secret Recipe Family Dinner Outing',
                amount: 2200,
                type: CategoryType.Expense,
                categoryKey: 'dining',
                accountKey: 'amex',
                date: daysAgo(48),
                time: '20:45',
                paymentMethod: 'Credit Card',
                tags: 'dining,dinner,family',
                note: 'Weekend family dinner',
            },
            {
                title: 'DESCO Summer Electricity Bill',
                amount: 2450,
                type: CategoryType.Expense,
                categoryKey: 'utilities',
                accountKey: 'bkash',
                date: daysAgo(47),
                time: '12:15',
                paymentMethod: 'bKash Pay',
                tags: 'electricity,bills,utility',
                note: 'Summer air conditioning power bill',
            },
            {
                title: 'Cloud Architecture Consultation Fee',
                amount: 28000,
                type: CategoryType.Income,
                categoryKey: 'freelance',
                accountKey: 'city_bank',
                date: daysAgo(45),
                time: '16:00',
                paymentMethod: 'Wire Transfer',
                tags: 'freelance,cloud,consulting',
                note: 'AWS & Microservices consultation payout',
            },
            {
                title: 'Dental Hygiene Checkup & Cleaning',
                amount: 2500,
                type: CategoryType.Expense,
                categoryKey: 'health',
                accountKey: 'city_bank',
                date: daysAgo(42),
                time: '16:00',
                paymentMethod: 'Debit Card',
                tags: 'dentist,health,clinic',
                note: 'Biannual dental hygiene checkup',
            },
            {
                title: 'Star Cineplex IMAX Movie & Snacks Combo',
                amount: 1600,
                type: CategoryType.Expense,
                categoryKey: 'entertainment',
                accountKey: 'bkash',
                date: daysAgo(38),
                time: '21:00',
                paymentMethod: 'bKash Online',
                tags: 'movies,cineplex,entertainment',
                note: 'IMAX Tickets and Popcorn Combo',
            },
            {
                title: 'Octane Fuel Refill (Full Tank)',
                amount: 3500,
                type: CategoryType.Expense,
                categoryKey: 'transport',
                accountKey: 'city_bank',
                date: daysAgo(35),
                time: '08:30',
                paymentMethod: 'Debit Card',
                tags: 'fuel,car,transport',
                note: 'Full tank at Trust Filling Station',
            },
            {
                title: 'Home Décor & Ergonomic Lighting',
                amount: 5200,
                type: CategoryType.Expense,
                categoryKey: 'shopping',
                accountKey: 'amex',
                date: daysAgo(32),
                time: '15:30',
                paymentMethod: 'Credit Card',
                tags: 'shopping,home,decor',
                note: 'Ergonomic workspace desk accessories',
            },

            // Cycle 3: Month -1 (10 to 30 days ago) — 1 transaction per category
            {
                title: 'TechCorp Base Salary',
                amount: 95000,
                type: CategoryType.Income,
                categoryKey: 'salary',
                accountKey: 'city_bank',
                date: daysAgo(28),
                time: '10:00',
                paymentMethod: 'Bank Transfer',
                tags: 'salary,income,techcorp',
                note: 'Latest monthly base salary',
            },
            {
                title: 'Apartment Monthly Rent & Service',
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
                title: 'Shwapno Super Shop Weekly Run',
                amount: 3950,
                type: CategoryType.Expense,
                categoryKey: 'groceries',
                accountKey: 'bkash',
                date: daysAgo(22),
                time: '19:30',
                paymentMethod: 'bKash QR',
                tags: 'groceries,shwapno,food',
                note: 'Fresh dairy, fruits, poultry',
            },
            {
                title: 'Mutual Fund Capital Gain Payout',
                amount: 6200,
                type: CategoryType.Income,
                categoryKey: 'dividends',
                accountKey: 'city_bank',
                date: daysAgo(20),
                time: '14:30',
                paymentMethod: 'BEFTN Dividend',
                tags: 'investment,funds,dividend',
                note: 'Mutual fund semi-annual dividend',
            },
            {
                title: 'Titas Gas & WASA Water Utility',
                amount: 1850,
                type: CategoryType.Expense,
                categoryKey: 'utilities',
                accountKey: 'bkash',
                date: daysAgo(19),
                time: '13:00',
                paymentMethod: 'bKash Pay',
                tags: 'utility,bills,wasa',
                note: 'Utility bill bundle payment',
            },
            {
                title: 'API Security & Performance Audit',
                amount: 45000,
                type: CategoryType.Income,
                categoryKey: 'freelance',
                accountKey: 'city_bank',
                date: daysAgo(18),
                time: '16:30',
                paymentMethod: 'Wire Transfer',
                tags: 'freelance,audit,backend',
                note: 'Payment for backend security & perf audit',
            },
            {
                title: 'Crimson Cup Artisan Cafe Outing',
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
                title: 'Routine Blood Panel & Diagnostic Lab',
                amount: 3200,
                type: CategoryType.Expense,
                categoryKey: 'health',
                accountKey: 'city_bank',
                date: daysAgo(14),
                time: '09:00',
                paymentMethod: 'Debit Card',
                tags: 'health,diagnostic,lab',
                note: 'Yearly preventive health test',
            },
            {
                title: 'Steam Games Summer Sale Bundle',
                amount: 2750,
                type: CategoryType.Expense,
                categoryKey: 'entertainment',
                accountKey: 'amex',
                date: daysAgo(12),
                time: '22:30',
                paymentMethod: 'Credit Card',
                tags: 'entertainment,gaming,steam',
                note: 'Indie game bundles and subscription',
            },
            {
                title: 'Custom Wireless Mechanical Keyboard',
                amount: 7500,
                type: CategoryType.Expense,
                categoryKey: 'shopping',
                accountKey: 'amex',
                date: daysAgo(11),
                time: '14:15',
                paymentMethod: 'Credit Card',
                tags: 'gadgets,tech,workspace',
                note: 'Custom wireless mechanical keyboard',
            },
            {
                title: 'Building Maintenance Surcharge',
                amount: 4500,
                type: CategoryType.Expense,
                categoryKey: 'rent',
                accountKey: 'city_bank',
                date: daysAgo(10),
                time: '11:00',
                paymentMethod: 'Online Banking',
                tags: 'housing,maintenance,bills',
                note: 'Quarterly building elevator & generator fund',
            },
            {
                title: 'Uber Rides & Inter-City Travel',
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

            // Cycle 4: Recent Weeks (1 to 8 days ago) — 1 transaction per category
            {
                title: 'BRAC Bank Equity Dividend',
                amount: 9800,
                type: CategoryType.Income,
                categoryKey: 'dividends',
                accountKey: 'city_bank',
                date: daysAgo(7),
                time: '11:00',
                paymentMethod: 'BEFTN Dividend',
                tags: 'investment,dividend,stocks',
                note: 'Annual equity cash dividend',
            },
            {
                title: 'Fresh Produce & Farmers Market Bazaar',
                amount: 2450,
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
                title: 'Quarterly Performance Bonus',
                amount: 35000,
                type: CategoryType.Income,
                categoryKey: 'salary',
                accountKey: 'city_bank',
                date: daysAgo(5),
                time: '12:00',
                paymentMethod: 'Bank Transfer',
                tags: 'salary,bonus,performance',
                note: 'Q2 excellence performance reward',
            },
            {
                title: 'Monthly Internet & Mobile Postpaid',
                amount: 2100,
                type: CategoryType.Expense,
                categoryKey: 'utilities',
                accountKey: 'bkash',
                date: daysAgo(4),
                time: '13:30',
                paymentMethod: 'bKash Pay',
                tags: 'utilities,internet,postpaid',
                note: 'Fiber and mobile bills',
            },
            {
                title: 'Bookstore & Tech Accessories',
                amount: 2800,
                type: CategoryType.Expense,
                categoryKey: 'shopping',
                accountKey: 'amex',
                date: daysAgo(4),
                time: '18:00',
                paymentMethod: 'Credit Card',
                tags: 'shopping,books,tech',
                note: 'Technical books and charging station',
            },
            {
                title: 'Frontend Dashboard Contract Milestone',
                amount: 22000,
                type: CategoryType.Income,
                categoryKey: 'freelance',
                accountKey: 'bkash',
                date: daysAgo(3),
                time: '17:00',
                paymentMethod: 'bKash QR',
                tags: 'freelance,frontend,contract',
                note: 'Delivery of Angular dashboard components',
            },
            {
                title: 'Acoustic Concert & Auditorium Tickets',
                amount: 2000,
                type: CategoryType.Expense,
                categoryKey: 'entertainment',
                accountKey: 'bkash',
                date: daysAgo(3),
                time: '20:00',
                paymentMethod: 'bKash Pay',
                tags: 'entertainment,concert,music',
                note: 'Live concert tickets',
            },
            {
                title: 'Madchef Gourmet Burgers & Shakes',
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
                title: 'CNG Auto & Local Transport Fare',
                amount: 650,
                type: CategoryType.Expense,
                categoryKey: 'transport',
                accountKey: 'cash',
                date: daysAgo(2),
                time: '18:15',
                paymentMethod: 'Cash',
                tags: 'transport,cash,local',
                note: 'Local city commute',
            },
            {
                title: 'Multivitamins & Omega 3 Supplements',
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
