import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { ClockTimePickerComponent } from '../../../shared/components/clock-time-picker/clock-time-picker.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category, CategoryType } from '../../../core/models/category.model';
import {
    CreateTransactionRequest,
    Transaction,
    TransactionAttachment,
    TransactionIntent,
} from '../../../core/models/transaction.model';
import { TagService } from '../../../core/services/tag.service';
import { AccountService } from '../../../core/services/account.service';
import { Account, AccountType } from '../../../core/models/account.model';
import { ToastService } from '../../../core/services/toast.service';
import { concatMap } from 'rxjs';

type EditorStep = 'basics' | 'details';

/** Which account types can pay / receive for a given payment method. */
const PAYMENT_METHOD_ACCOUNT_TYPES: Record<string, AccountType[] | 'all'> = {
    Cash: ['Cash'],
    'Credit Card': ['Credit'],
    'Debit Card': ['Bank'],
    'Bank Transfer': ['Bank'],
    'Mobile Payment': ['MFS'],
    Crypto: 'all',
    Other: 'all',
};

interface IntentOption {
    id: TransactionIntent;
    label: string;
    hint: string;
    icon: string;
    accent: string;
}

@Component({
    selector: 'app-transaction-editor',
    standalone: true,
    imports: [
        DecimalPipe,
        ReactiveFormsModule,
        RouterLink,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatDatepickerModule,
        MatCheckboxModule,
        MatRadioModule,
        ClockTimePickerComponent,
    ],
    templateUrl: './transaction-editor.component.html',
    styleUrl: './transaction-editor.component.scss',
})
export class TransactionEditorComponent implements OnInit {
    private fb = inject(FormBuilder);
    private transactionService = inject(TransactionService);
    categoryService = inject(CategoryService);
    accountService = inject(AccountService);
    tagService = inject(TagService);
    private toast = inject(ToastService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);

    CategoryType = CategoryType;
    errorMessage = '';
    activeStep = signal<EditorStep>('basics');
    intent = signal<TransactionIntent | null>(null);
    calcHistory: Array<{ expression: string; result: number }> = [];
    selectedTags: string[] = [];
    isEditMode = false;
    transactionId: string | null = null;
    isSubmitting = false;
    calcExpression = '';
    attachedFiles: TransactionAttachment[] = [];
    showTimePicker = false;
    showCalculator = false;
    tagDropdownOpen = false;
    tagSearch = '';

    /** Kept for existing specs that still assert calculator-tab behavior. */
    get activeTab(): 'calculator' | 'details' {
        return this.activeStep() === 'details' ? 'details' : 'calculator';
    }
    set activeTab(value: 'calculator' | 'details') {
        this.activeStep.set(value === 'details' ? 'details' : 'basics');
    }

    readonly intentOptions: IntentOption[] = [
        {
            id: 'expense',
            label: 'Expense',
            hint: 'Log a purchase or bill paid from an account',
            icon: 'shopping_bag',
            accent: 'expense',
        },
        {
            id: 'salary',
            label: 'Salary',
            hint: 'Credit pay or income into one of your accounts',
            icon: 'payments',
            accent: 'salary',
        },
        {
            id: 'transfer',
            label: 'Transfer',
            hint: 'Move money between accounts, cash out, or receive from outside',
            icon: 'swap_horiz',
            accent: 'transfer',
        },
    ];

    paymentMethodOptions = [
        { label: 'Cash', value: 'Cash' },
        { label: 'Credit Card', value: 'Credit Card' },
        { label: 'Debit Card', value: 'Debit Card' },
        { label: 'Bank Transfer', value: 'Bank Transfer' },
        { label: 'Mobile Payment', value: 'Mobile Payment' },
        { label: 'Crypto', value: 'Crypto' },
        { label: 'Other', value: 'Other' },
    ];

    form = this.fb.group({
        title: ['', Validators.required],
        amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
        type: [CategoryType.Expense, Validators.required],
        categoryId: ['', Validators.required],
        accountId: ['', Validators.required],
        sourceAccountId: [''],
        targetAccountId: [''],
        externalSource: [false],
        externalSourceLabel: [''],
        date: [new Date(), Validators.required],
        time: [new Date().toTimeString().substring(0, 5)],
        paymentMethod: [''],
        receiptFileName: [''],
        receiptUrl: [''],
        tags: [''],
        note: [''],
    });

    /** Drives Paid-from / Credit-to filtering after a payment method is chosen. */
    readonly selectedPaymentMethod = signal('');

    readonly expenseCategories = computed(() =>
        this.categoryService.categories().filter((c) => c.type === CategoryType.Expense),
    );
    readonly incomeCategories = computed(() =>
        this.categoryService.categories().filter((c) => c.type === CategoryType.Income),
    );
    readonly openAccounts = computed(() => this.accountService.accounts().filter((a) => !a.isClosed));

    readonly payableAccounts = computed(() => this.accountsForPaymentMethod(this.selectedPaymentMethod()));

    readonly paymentMethodHint = computed(() => {
        const method = this.selectedPaymentMethod();
        if (!method) return '';
        const allowed = PAYMENT_METHOD_ACCOUNT_TYPES[method] ?? 'all';
        if (allowed === 'all') return 'Showing all open accounts';
        return `Showing ${allowed.join(' / ')} accounts`;
    });
    readonly stepIndex = computed(() => {
        const order: EditorStep[] = ['basics', 'details'];
        return order.indexOf(this.activeStep());
    });

    readonly steps = computed(() => [
        {
            id: 'basics' as const,
            label: this.isEditMode ? 'Amount' : 'Type & Amount',
        },
        { id: 'details' as const, label: 'Details' },
    ]);

    ngOnInit(): void {
        this.categoryService.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

        this.tagService.loadTags().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

        this.accountService
            .getAccounts()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: () => this.applyDefaultAccount(), error: () => {} });

        this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
            const id = params.get('id');
            if (id) {
                this.isEditMode = true;
                this.transactionId = id;
                this.activeStep.set('basics');
                this.loadTransaction(id);
            }
        });

        const intentParam = this.route.snapshot.queryParamMap.get('intent') as TransactionIntent | null;
        if (intentParam && ['expense', 'salary', 'transfer'].includes(intentParam) && !this.isEditMode) {
            this.selectIntent(intentParam);
        }
    }

    selectIntent(intent: TransactionIntent): void {
        this.intent.set(intent);
        this.errorMessage = '';
        this.applyIntentDefaults(intent);
        this.activeStep.set('basics');
    }

    private applyIntentDefaults(intent: TransactionIntent): void {
        if (intent === 'expense') {
            this.form.patchValue({
                type: CategoryType.Expense,
                paymentMethod: '',
                accountId: '',
                categoryId: this.preferredCategoryId(this.expenseCategories()),
            });
            this.selectedPaymentMethod.set('');
            this.form.controls.paymentMethod.setValidators([Validators.required]);
            this.form.controls.categoryId.setValidators([Validators.required]);
            this.form.controls.accountId.setValidators([Validators.required]);
            this.form.controls.title.setValidators([Validators.required]);
            this.form.controls.sourceAccountId.clearValidators();
            this.form.controls.targetAccountId.clearValidators();
            this.form.controls.externalSourceLabel.clearValidators();
        } else if (intent === 'salary') {
            const salaryCat = this.findCategoryByName(this.incomeCategories(), 'salary');
            this.form.patchValue({
                type: CategoryType.Income,
                paymentMethod: '',
                accountId: '',
                categoryId:
                    this.preferredCategoryId(this.incomeCategories()) ??
                    salaryCat?.id ??
                    this.incomeCategories()[0]?.id ??
                    '',
                title: this.form.value.title || 'Monthly Salary',
            });
            this.selectedPaymentMethod.set('');
            this.form.controls.paymentMethod.setValidators([Validators.required]);
            this.form.controls.categoryId.setValidators([Validators.required]);
            this.form.controls.accountId.setValidators([Validators.required]);
            this.form.controls.title.setValidators([Validators.required]);
            this.form.controls.sourceAccountId.clearValidators();
            this.form.controls.targetAccountId.clearValidators();
            this.form.controls.externalSourceLabel.clearValidators();
        } else {
            this.form.patchValue({
                type: CategoryType.Expense,
                paymentMethod: 'Bank Transfer',
                categoryId: '',
                title: '',
            });
            this.selectedPaymentMethod.set('Bank Transfer');
            this.form.controls.paymentMethod.clearValidators();
            this.form.controls.categoryId.clearValidators();
            this.form.controls.accountId.clearValidators();
            this.form.controls.title.clearValidators();
            this.form.controls.targetAccountId.setValidators([Validators.required]);
            this.syncTransferSourceValidators();
        }

        this.form.controls.paymentMethod.updateValueAndValidity({ emitEvent: false });
        this.form.controls.categoryId.updateValueAndValidity({ emitEvent: false });
        this.form.controls.accountId.updateValueAndValidity({ emitEvent: false });
        this.form.controls.title.updateValueAndValidity({ emitEvent: false });
        this.form.controls.sourceAccountId.updateValueAndValidity({ emitEvent: false });
        this.form.controls.targetAccountId.updateValueAndValidity({ emitEvent: false });
        this.form.controls.externalSourceLabel.updateValueAndValidity({ emitEvent: false });
        this.applyDefaultAccount();
    }

    onPaymentMethodChange(method: string): void {
        const next = method || '';
        this.selectedPaymentMethod.set(next);
        this.form.patchValue({ paymentMethod: next });

        const allowed = this.accountsForPaymentMethod(next);
        const current = this.form.controls.accountId.value;
        if (!current || !allowed.some((a) => a.id === current)) {
            const requested = this.route.snapshot.queryParamMap.get('accountId');
            const match = requested && allowed.some((a) => a.id === requested) ? requested : allowed[0]?.id || '';
            this.form.patchValue({ accountId: match });
        }
    }

    private accountsForPaymentMethod(method: string): Account[] {
        if (!method) return [];
        const mapping = PAYMENT_METHOD_ACCOUNT_TYPES[method] ?? 'all';
        const accounts = this.openAccounts();
        if (mapping === 'all') return accounts;
        return accounts.filter((account) => mapping.includes(account.accountType));
    }

    onExternalSourceChange(checked: boolean): void {
        this.form.patchValue({ externalSource: checked });
        this.syncTransferSourceValidators();
    }

    private syncTransferSourceValidators(): void {
        if (this.intent() !== 'transfer') return;

        if (this.form.value.externalSource) {
            this.form.controls.sourceAccountId.clearValidators();
            this.form.controls.externalSourceLabel.setValidators([Validators.required, Validators.minLength(2)]);
        } else {
            this.form.controls.externalSourceLabel.clearValidators();
            this.form.controls.sourceAccountId.setValidators([Validators.required]);
        }
        this.form.controls.sourceAccountId.updateValueAndValidity({ emitEvent: false });
        this.form.controls.externalSourceLabel.updateValueAndValidity({ emitEvent: false });
    }

    private findCategoryByName(categories: Category[], name: string): Category | undefined {
        const needle = name.toLowerCase();
        return (
            categories.find((c) => c.name.toLowerCase() === needle) ??
            categories.find((c) => c.name.toLowerCase().includes(needle))
        );
    }

    /**
     * Honors a ?categoryId= deep link (e.g. Record in this Category) when the
     * requested category is valid for the intent, otherwise falls back to the
     * first matching category of that type.
     */
    private preferredCategoryId(categories: Category[]): string {
        const requested = this.route.snapshot.queryParamMap.get('categoryId');
        const match = requested ? categories.find((c) => c.id === requested) : undefined;
        return match?.id || categories[0]?.id || '';
    }

    private resolveTransferCategories(): { outCategoryId: string; inCategoryId: string } | null {
        const expenseCats = this.expenseCategories();
        const incomeCats = this.incomeCategories();
        const out =
            this.findCategoryByName(expenseCats, 'transfer') ??
            this.findCategoryByName(expenseCats, 'transfer out') ??
            expenseCats[0];
        const inn =
            this.findCategoryByName(incomeCats, 'transfer') ??
            this.findCategoryByName(incomeCats, 'transfer in') ??
            incomeCats.find((c) => !c.name.toLowerCase().includes('salary')) ??
            incomeCats[0];

        if (!out || !inn) return null;
        return { outCategoryId: out.id, inCategoryId: inn.id };
    }

    /** Prefills account from ?accountId= (account page Record Entry). */
    private applyDefaultAccount(): void {
        if (this.isEditMode) return;

        const accounts = this.openAccounts();
        if (accounts.length === 0) return;

        const requested = this.route.snapshot.queryParamMap.get('accountId');
        const match = requested && accounts.some((a) => a.id === requested) ? requested : accounts[0].id;
        const intent = this.intent();

        if (intent === 'transfer') {
            const currentTarget = this.form.controls.targetAccountId.value;
            const currentSource = this.form.controls.sourceAccountId.value;

            if (requested && accounts.some((a) => a.id === requested)) {
                if (!currentSource) {
                    this.form.patchValue({ sourceAccountId: requested });
                }
                if (!currentTarget) {
                    const other = accounts.find((a) => a.id !== requested);
                    if (other) this.form.patchValue({ targetAccountId: other.id });
                }
                return;
            }

            if (!currentTarget) {
                this.form.patchValue({ targetAccountId: accounts[0].id });
            }
            if (!currentSource && !this.form.value.externalSource) {
                const targetId = this.form.controls.targetAccountId.value || accounts[0].id;
                const other = accounts.find((a) => a.id !== targetId);
                this.form.patchValue({ sourceAccountId: other?.id || '' });
            }
            return;
        }

        if (!this.form.controls.accountId.value) {
            // Expense/salary: wait until a payment method filters the account list.
            if (intent === 'expense' || intent === 'salary') {
                if (!this.selectedPaymentMethod()) return;
                const allowed = this.payableAccounts();
                const preferred = requested && allowed.some((a) => a.id === requested) ? requested : allowed[0]?.id;
                if (preferred) this.form.patchValue({ accountId: preferred });
                return;
            }
            this.form.patchValue({ accountId: match });
        }
    }

    goToStep(step: EditorStep): void {
        if (step === 'details') {
            if (!this.intent() && !this.isEditMode) return;
            this.evaluateExpression(true, true);
            if (!this.form.controls.amount.valid) {
                this.errorMessage = 'Enter a valid amount before continuing.';
                return;
            }
        }
        this.errorMessage = '';
        this.activeStep.set(step);
    }

    nextStep(): void {
        if (this.activeStep() === 'basics') this.goToStep('details');
    }

    prevStep(): void {
        if (this.activeStep() === 'details') {
            this.activeStep.set('basics');
        }
    }

    accountLabel(id: string | null | undefined): string {
        if (!id) return '—';
        const account = this.openAccounts().find((a) => a.id === id);
        return account ? `${account.icon} ${account.name}` : id;
    }

    intentLabel(): string {
        return this.intentOptions.find((o) => o.id === this.intent())?.label || 'Transaction';
    }

    isTagSelected(tag: string): boolean {
        return this.selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase());
    }

    get filteredTags(): string[] {
        const q = this.tagSearch.toLowerCase();
        return this.tagService
            .tags()
            .filter((t) => !q || t.toLowerCase().includes(q))
            .sort((a, b) => a.localeCompare(b));
    }

    get canCreateNewTag(): boolean {
        const q = this.tagSearch.trim();
        return q.length > 0 && !this.filteredTags.some((t) => t.toLowerCase() === q.toLowerCase());
    }

    onTagSearchInput(inputEl: HTMLInputElement): void {
        this.tagSearch = inputEl.value.trim();
    }

    toggleTag(tag: string): void {
        if (this.isTagSelected(tag)) {
            this.selectedTags = this.selectedTags.filter((t) => t.toLowerCase() !== tag.toLowerCase());
        } else {
            this.selectedTags = [...this.selectedTags, tag];
        }
        this.form.patchValue({ tags: this.selectedTags.join(', ') });
    }

    removeTag(tag: string): void {
        this.selectedTags = this.selectedTags.filter((t) => t.toLowerCase() !== tag.toLowerCase());
        this.form.patchValue({ tags: this.selectedTags.join(', ') });
    }

    createTagFromSearch(inputEl: HTMLInputElement): void {
        const raw = inputEl.value.trim().replace(/^#/, '');
        if (!raw) return;
        this.tagService
            .createTag(raw)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((added) => {
                if (added && !this.selectedTags.some((t) => t.toLowerCase() === added.toLowerCase())) {
                    this.selectedTags = [...this.selectedTags, added];
                }
                this.form.patchValue({ tags: this.selectedTags.join(', ') });
            });
        inputEl.value = '';
        this.tagSearch = '';
    }

    closeTagDropdown(): void {
        setTimeout(() => {
            this.tagDropdownOpen = false;
        }, 150);
    }

    onTagPickerKeydown(event: KeyboardEvent, inputEl: HTMLInputElement): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            if (this.canCreateNewTag) {
                this.createTagFromSearch(inputEl);
            } else if (this.filteredTags.length > 0) {
                const first = this.filteredTags[0];
                if (!this.isTagSelected(first)) {
                    this.toggleTag(first);
                }
                inputEl.value = '';
                this.tagSearch = '';
            }
        } else if (event.key === 'Escape') {
            this.tagDropdownOpen = false;
            inputEl.blur();
        }
    }

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const files = Array.from(input.files);
            files.forEach((file) => {
                const reader = new FileReader();
                reader.onload = () => {
                    this.attachedFiles = [
                        ...this.attachedFiles,
                        {
                            fileName: file.name,
                            fileUrl: reader.result as string,
                        },
                    ];
                    if (this.attachedFiles.length === 1) {
                        this.form.patchValue({
                            receiptFileName: file.name,
                            receiptUrl: reader.result as string,
                        });
                    }
                };
                reader.readAsDataURL(file);
            });
            input.value = '';
        }
    }

    removeAttachedFile(index: number): void {
        const updated = [...this.attachedFiles];
        updated.splice(index, 1);
        this.attachedFiles = updated;
        if (this.attachedFiles.length > 0) {
            this.form.patchValue({
                receiptFileName: this.attachedFiles[0].fileName,
                receiptUrl: this.attachedFiles[0].fileUrl,
            });
        } else {
            this.form.patchValue({
                receiptFileName: '',
                receiptUrl: '',
            });
        }
    }

    getAttachmentIcon(name: string): string {
        const n = (name || '').toLowerCase();
        if (/\.(jpg|jpeg|jpe|png|gif|webp|svg)$/.test(n)) return 'image';
        if (/\.pdf$/.test(n)) return 'picture_as_pdf';
        if (/\.(docx|doc)$/.test(n)) return 'description';
        return 'description';
    }

    private loadTransaction(id: string): void {
        const existing = this.transactionService.transactions().find((t) => t.id === id);
        if (existing) {
            this.populateForm(existing);
        } else {
            this.transactionService
                .getTransactionById(id)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((found) => {
                    if (found) {
                        this.populateForm(found);
                    }
                });
        }
    }

    private inferIntent(tx: Transaction): TransactionIntent {
        const tags = (tx.tags || '').toLowerCase();
        if (tags.includes('transfer')) return 'transfer';
        if (tx.type === CategoryType.Income) {
            const cat = this.categoryService.categories().find((c) => c.id === tx.categoryId);
            if (cat && cat.name.toLowerCase().includes('salary')) return 'salary';
            return 'salary';
        }
        return 'expense';
    }

    private populateForm(tx: Transaction): void {
        const inferred = this.inferIntent(tx);
        this.intent.set(inferred);
        this.activeStep.set('details');
        this.calcExpression = tx.amount.toString();

        if (tx.tags) {
            this.selectedTags = tx.tags
                .split(',')
                .map((s) => s.trim().replace(/^#/, ''))
                .filter(Boolean);
            this.ensureTagsInGlobalList(this.selectedTags);
        } else {
            this.selectedTags = [];
        }

        if (tx.attachments && tx.attachments.length > 0) {
            this.attachedFiles = [...tx.attachments];
        } else if (tx.receiptFileName || tx.receiptUrl) {
            this.attachedFiles = [
                {
                    fileName: tx.receiptFileName || 'Attached Document',
                    fileUrl: tx.receiptUrl || '',
                },
            ];
        } else {
            this.attachedFiles = [];
        }

        this.applyIntentDefaults(inferred);

        this.selectedPaymentMethod.set(tx.paymentMethod || '');
        this.form.patchValue({
            title: tx.title,
            amount: tx.amount,
            type: tx.type,
            categoryId: tx.categoryId,
            accountId: tx.accountId,
            targetAccountId: inferred === 'transfer' ? tx.accountId : '',
            sourceAccountId: '',
            externalSource: inferred === 'transfer' && tx.type === CategoryType.Income,
            date: tx.date ? new Date(tx.date) : new Date(),
            time: tx.time || new Date().toTimeString().substring(0, 5),
            paymentMethod: tx.paymentMethod || '',
            receiptFileName: tx.receiptFileName || '',
            receiptUrl: tx.receiptUrl || '',
            tags: this.selectedTags.join(', '),
            note: tx.note || '',
        });
    }

    calcAppendDigit(digit: string): void {
        this.calcExpression += digit;
        this.autoEvaluate();
    }

    calcAppendOp(op: string): void {
        if (op === '%') {
            this.evaluateExpression(true, true);
            const val = Number(this.form.get('amount')?.value);
            if (val) {
                const pct = Math.round((val / 100) * 100) / 100;
                this.form.patchValue({ amount: pct });
                this.calcExpression = pct.toString();
            }
            return;
        }
        if (!this.calcExpression && op !== '-') return;
        const lastChar = this.calcExpression.slice(-1);
        if (['+', '-', '*', '/'].includes(lastChar)) {
            this.calcExpression = this.calcExpression.slice(0, -1) + op;
        } else {
            this.calcExpression += op;
        }
    }

    calcClear(): void {
        this.calcExpression = '';
        this.form.patchValue({ amount: null });
    }

    /** Highlight 0 so the next keystroke replaces it instead of becoming "05". */
    onAmountFocus(event: FocusEvent): void {
        const input = event.target as HTMLInputElement;
        const value = this.form.controls.amount.value;
        if (value === 0 || input.value === '0' || input.value === '0.00') {
            queueMicrotask(() => input.select());
        }
    }

    onAmountInput(): void {
        const amount = this.form.value.amount;
        this.calcExpression = amount == null ? '' : String(amount);
    }

    calcBackspace(): void {
        this.calcExpression = this.calcExpression.slice(0, -1);
        this.autoEvaluate();
    }

    calcEqual(): void {
        this.evaluateExpression(true, true);
    }

    useHistoryValue(item: { expression: string; result: number }): void {
        this.calcExpression = item.result.toString();
        this.form.patchValue({ amount: item.result });
    }

    clearHistory(): void {
        this.calcHistory = [];
    }

    applyCalculatedAmountAndNext(): void {
        this.evaluateExpression(true, true);
        this.goToStep('details');
    }

    private autoEvaluate(): void {
        if (!this.calcExpression) return;
        const lastChar = this.calcExpression.slice(-1);
        if (['+', '-', '*', '/'].includes(lastChar)) return;
        this.evaluateExpression(false, false);
    }

    private evaluateExpression(recordHistory = false, updateExpression = true): void {
        if (!this.calcExpression) return;
        try {
            const sanitized = this.calcExpression.replace(/[^0-9+\-*/.]/g, '');
            if (!sanitized) return;
            const result = this.safeEvaluate(sanitized);
            if (result !== null && !isNaN(result) && isFinite(result)) {
                const rounded = Math.round(result * 100) / 100;
                this.form.patchValue({ amount: rounded });
                if (recordHistory && this.calcExpression !== rounded.toString()) {
                    this.calcHistory.unshift({ expression: this.calcExpression, result: rounded });
                }
                if (updateExpression) {
                    this.calcExpression = rounded.toString();
                }
            }
        } catch {
            // Ignored during typing
        }
    }

    private safeEvaluate(expression: string): number | null {
        const tokens = expression.match(/\d+\.?\d*|\.\d+|[+\-*/]/g);
        if (!tokens || tokens.length === 0) return null;

        let index = 0;
        const peek = (): string | undefined => tokens[index];
        const next = (): string | undefined => tokens[index++];

        const parseNumber = (): number => {
            const tok = next();
            if (tok === undefined || tok === '+' || tok === '-' || tok === '*' || tok === '/') {
                throw new Error('Invalid expression');
            }
            return Number(tok);
        };

        const parseFactor = (): number => {
            let value = parseNumber();
            while (peek() === '*' || peek() === '/') {
                const op = next();
                const rhs = parseNumber();
                if (op === '*') value *= rhs;
                else if (rhs === 0) throw new Error('Division by zero');
                else value /= rhs;
            }
            return value;
        };

        let result = parseFactor();
        while (peek() === '+' || peek() === '-') {
            const op = next();
            const rhs = parseFactor();
            if (op === '+') result += rhs;
            else result -= rhs;
        }

        return index === tokens.length ? result : null;
    }

    cancel(): void {
        this.router.navigate(['/transactions']);
    }

    openTimePicker(): void {
        this.showTimePicker = true;
    }

    onTimePicked(time: string): void {
        this.form.patchValue({ time });
        this.showTimePicker = false;
    }

    detailsValid(): boolean {
        const intent = this.intent();
        if (!intent) return false;
        if (!this.form.controls.amount.valid || !this.form.controls.date.valid) return false;

        if (intent === 'expense') {
            return !!(
                this.form.controls.title.valid &&
                this.form.controls.categoryId.valid &&
                this.form.controls.paymentMethod.valid &&
                this.selectedPaymentMethod() &&
                this.form.controls.accountId.valid
            );
        }
        if (intent === 'salary') {
            return !!(
                this.form.controls.title.valid &&
                this.form.controls.categoryId.valid &&
                this.form.controls.paymentMethod.valid &&
                this.selectedPaymentMethod() &&
                this.form.controls.accountId.valid
            );
        }

        // transfer
        this.syncTransferSourceValidators();
        if (!this.form.controls.targetAccountId.valid) return false;
        if (this.form.value.externalSource) {
            return this.form.controls.externalSourceLabel.valid;
        }
        const source = this.form.value.sourceAccountId;
        const target = this.form.value.targetAccountId;
        return !!source && !!target && source !== target;
    }

    submit(): void {
        if (!this.detailsValid() || this.isSubmitting) return;

        this.errorMessage = '';
        this.isSubmitting = true;
        const intent = this.intent();

        if (this.isEditMode && this.transactionId) {
            this.submitUpdate();
            return;
        }

        if (intent === 'transfer') {
            this.submitTransfer();
            return;
        }

        this.submitSingle(intent === 'salary' ? CategoryType.Income : CategoryType.Expense);
    }

    private basePayload(): Omit<CreateTransactionRequest, 'type' | 'categoryId' | 'accountId' | 'title'> & {
        title: string;
    } {
        const val = this.form.getRawValue();
        const tagsString = this.selectedTags.join(', ');
        return {
            title: val.title || '',
            amount: Number(val.amount),
            date: new Date(val.date!).toISOString(),
            time: val.time || '',
            paymentMethod: val.paymentMethod || 'Cash',
            receiptFileName: val.receiptFileName || '',
            receiptUrl: val.receiptUrl || '',
            tags: tagsString,
            note: val.note || '',
            attachments: this.attachedFiles,
            timeZoneOffsetInMinutes: new Date().getTimezoneOffset(),
        };
    }

    private submitSingle(type: CategoryType): void {
        const val = this.form.getRawValue();
        const base = this.basePayload();

        this.transactionService
            .createTransaction({
                ...base,
                type,
                categoryId: val.categoryId!,
                accountId: val.accountId!,
                paymentMethod: val.paymentMethod || (type === CategoryType.Income ? 'Bank Transfer' : 'Cash'),
            })
            .subscribe({
                next: () =>
                    this.onSaveSuccess(this.intent() === 'salary' ? 'Salary credited' : 'New transaction recorded'),
                error: (err) => this.onSaveError(err),
            });
    }

    private submitTransfer(): void {
        const cats = this.resolveTransferCategories();
        if (!cats) {
            this.isSubmitting = false;
            this.errorMessage = 'Add at least one Income and one Expense category before recording a transfer.';
            return;
        }

        const val = this.form.getRawValue();
        const amount = Number(val.amount);
        const target = this.openAccounts().find((a) => a.id === val.targetAccountId);
        const source = this.openAccounts().find((a) => a.id === val.sourceAccountId);
        const note = val.note || '';
        const tags = this.ensureTransferTag(this.selectedTags.join(', '));
        const timeZoneOffsetInMinutes = new Date().getTimezoneOffset();
        const date = new Date(val.date!).toISOString();
        const time = val.time || '';

        if (val.externalSource) {
            const label = (val.externalSourceLabel || 'External source').trim();
            const req: CreateTransactionRequest = {
                title: val.title?.trim() || `Transfer from ${label}`,
                amount,
                type: CategoryType.Income,
                categoryId: cats.inCategoryId,
                accountId: val.targetAccountId!,
                date,
                time,
                paymentMethod: 'Bank Transfer',
                receiptFileName: val.receiptFileName || '',
                receiptUrl: val.receiptUrl || '',
                tags,
                note: note || `Received from outside: ${label}`,
                attachments: this.attachedFiles,
                timeZoneOffsetInMinutes,
            };

            this.transactionService.createTransaction(req).subscribe({
                next: () => this.onSaveSuccess('Transfer received'),
                error: (err) => this.onSaveError(err),
            });
            return;
        }

        if (!source || !target || source.id === target.id) {
            this.isSubmitting = false;
            this.errorMessage = 'Pick two different accounts for source and target.';
            return;
        }

        const outReq: CreateTransactionRequest = {
            title: val.title?.trim() || `Transfer to ${target.name}`,
            amount,
            type: CategoryType.Expense,
            categoryId: cats.outCategoryId,
            accountId: source.id,
            date,
            time,
            paymentMethod: 'Bank Transfer',
            tags,
            note: note || `Sent to ${target.name}`,
            attachments: this.attachedFiles,
            timeZoneOffsetInMinutes,
        };

        const inReq: CreateTransactionRequest = {
            title: val.title?.trim() || `Transfer from ${source.name}`,
            amount,
            type: CategoryType.Income,
            categoryId: cats.inCategoryId,
            accountId: target.id,
            date,
            time,
            paymentMethod: 'Bank Transfer',
            tags,
            note: note || `Received from ${source.name}`,
            attachments: [],
            timeZoneOffsetInMinutes,
        };

        this.transactionService
            .createTransaction(outReq)
            .pipe(concatMap(() => this.transactionService.createTransaction(inReq)))
            .subscribe({
                next: () => this.onSaveSuccess('Transfer completed'),
                error: (err) => this.onSaveError(err),
            });
    }

    private submitUpdate(): void {
        const val = this.form.getRawValue();
        const intent = this.intent();
        const tagsString = this.ensureTransferTag(this.selectedTags.join(', '), intent === 'transfer');

        let accountId = val.accountId!;
        let type = Number(val.type) as CategoryType;
        let categoryId = val.categoryId!;

        if (intent === 'transfer') {
            accountId = val.targetAccountId || val.accountId!;
            const cats = this.resolveTransferCategories();
            if (cats) {
                categoryId = type === CategoryType.Income ? cats.inCategoryId : cats.outCategoryId;
            }
        } else if (intent === 'salary') {
            type = CategoryType.Income;
        } else if (intent === 'expense') {
            type = CategoryType.Expense;
        }

        this.transactionService
            .updateTransaction({
                id: this.transactionId!,
                title: val.title!,
                amount: Number(val.amount),
                type,
                categoryId,
                accountId,
                date: new Date(val.date!).toISOString(),
                time: val.time || '',
                paymentMethod: val.paymentMethod || 'Cash',
                receiptFileName: val.receiptFileName || '',
                receiptUrl: val.receiptUrl || '',
                tags: tagsString,
                note: val.note || '',
                attachments: this.attachedFiles,
                timeZoneOffsetInMinutes: new Date().getTimezoneOffset(),
            })
            .subscribe({
                next: () => this.onSaveSuccess('Transaction updated'),
                error: (err) => this.onSaveError(err),
            });
    }

    /** Registers transaction tags that aren't in the global list so the picker offers them. */
    private ensureTagsInGlobalList(tags: string[]): void {
        tags.forEach((tag) => {
            this.tagService.createTag(tag).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        });
    }

    private ensureTransferTag(tags: string, force = true): string {
        if (!force && this.intent() !== 'transfer') return tags;
        const parts = tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        if (!parts.some((t) => t.toLowerCase() === 'transfer')) {
            parts.push('transfer');
        }
        return parts.join(', ');
    }

    private onSaveSuccess(message: string): void {
        this.isSubmitting = false;
        this.toast.show(message);
        this.accountService.getAccounts().subscribe({ error: () => undefined });
        this.router.navigate(['/transactions']);
    }

    private onSaveError(err: { error?: { error?: string } }): void {
        this.isSubmitting = false;
        this.errorMessage = err.error?.error || 'Failed to save transaction.';
    }

    transferAccountsConflict(): boolean {
        if (this.intent() !== 'transfer' || this.form.value.externalSource) return false;
        const s = this.form.value.sourceAccountId;
        const t = this.form.value.targetAccountId;
        return !!s && !!t && s === t;
    }

    filteredTargetAccounts(): Account[] {
        const source = this.form.value.sourceAccountId;
        return this.openAccounts().filter((a) => !source || a.id !== source || this.form.value.externalSource);
    }

    filteredSourceAccounts(): Account[] {
        const target = this.form.value.targetAccountId;
        return this.openAccounts().filter((a) => !target || a.id !== target);
    }
}
