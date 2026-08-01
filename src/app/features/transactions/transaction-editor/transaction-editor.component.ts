import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { ClockTimePickerComponent } from '../../../shared/components/clock-time-picker/clock-time-picker.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryType } from '../../../core/models/category.model';
import { Transaction, TransactionAttachment } from '../../../core/models/transaction.model';
import { TagService } from '../../../core/services/tag.service';

const DEFAULT_ACCOUNT_ID = 'default-account';

@Component({
  selector: 'app-transaction-editor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatDatepickerModule, MatTimepickerModule, ClockTimePickerComponent],  
  templateUrl: './transaction-editor.component.html',
  styleUrl: './transaction-editor.component.scss'
})
export class TransactionEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);
  categoryService = inject(CategoryService);
  tagService = inject(TagService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  CategoryType = CategoryType;
  errorMessage = '';
  activeTab: 'calculator' | 'details' = 'calculator';
  calcHistory: Array<{ expression: string; result: number }> = [];
  selectedTags: string[] = [];
  isEditMode = false;
  transactionId: string | null = null;
  isSubmitting = false;
  calcExpression = '';
  attachedFiles: TransactionAttachment[] = [];
  showTimePicker = false;

  typeOptions = [
    { label: 'Income', value: CategoryType.Income },
    { label: 'Expense', value: CategoryType.Expense }
  ];

  paymentMethodOptions = [
    { label: 'Cash', value: 'Cash' },
    { label: 'Credit Card', value: 'Credit Card' },
    { label: 'Debit Card', value: 'Debit Card' },
    { label: 'Bank Transfer', value: 'Bank Transfer' },
    { label: 'Mobile Payment', value: 'Mobile Payment' },
    { label: 'Crypto', value: 'Crypto' },
    { label: 'Other', value: 'Other' }
  ];

  form = this.fb.group({
    title: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    type: [CategoryType.Expense, Validators.required],
    categoryId: ['', Validators.required],
    date: [new Date(), Validators.required],
    time: [new Date().toTimeString().substring(0, 5)],
    paymentMethod: ['Cash'],
    receiptFileName: [''],
    receiptUrl: [''],
    tags: ['']
  });

  ngOnInit(): void {
    this.categoryService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.isEditMode = true;
          this.transactionId = id;
          this.loadTransaction(id);
        }
      });
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.some(t => t.toLowerCase() === tag.toLowerCase());
  }

  tagDropdownOpen = false;
  tagSearch = '';

  get filteredTags(): string[] {
    const q = this.tagSearch.toLowerCase();
    return this.tagService.tags()
      .filter(t => !q || t.toLowerCase().includes(q))
      .sort((a, b) => a.localeCompare(b));
  }

  get canCreateNewTag(): boolean {
    const q = this.tagSearch.trim();
    return q.length > 0 && !this.filteredTags.some(t => t.toLowerCase() === q.toLowerCase());
  }

  onTagSearchInput(inputEl: HTMLInputElement): void {
    this.tagSearch = inputEl.value.trim();
  }

  toggleTag(tag: string): void {
    if (this.isTagSelected(tag)) {
      this.selectedTags = this.selectedTags.filter(t => t.toLowerCase() !== tag.toLowerCase());
    } else {
      this.selectedTags = [...this.selectedTags, tag];
    }
    this.form.patchValue({ tags: this.selectedTags.join(', ') });
  }

  removeTag(tag: string): void {
    this.selectedTags = this.selectedTags.filter(t => t.toLowerCase() !== tag.toLowerCase());
    this.form.patchValue({ tags: this.selectedTags.join(', ') });
  }

  createTagFromSearch(inputEl: HTMLInputElement): void {
    const raw = inputEl.value.trim().replace(/^#/, '');
    if (!raw) return;
    const added = this.tagService.addTag(raw);
    if (added && !this.selectedTags.some(t => t.toLowerCase() === added.toLowerCase())) {
      this.selectedTags = [...this.selectedTags, added];
    }
    this.form.patchValue({ tags: this.selectedTags.join(', ') });
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
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          this.attachedFiles = [...this.attachedFiles, {
            fileName: file.name,
            fileUrl: reader.result as string
          }];
          if (this.attachedFiles.length === 1) {
            this.form.patchValue({
              receiptFileName: file.name,
              receiptUrl: reader.result as string
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
        receiptUrl: this.attachedFiles[0].fileUrl
      });
    } else {
      this.form.patchValue({
        receiptFileName: '',
        receiptUrl: ''
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
    const existing = this.transactionService.transactions().find(t => t.id === id);
    if (existing) {
      this.populateForm(existing);
    } else {
      this.transactionService.getTransactionById(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(found => {
          if (found) {
            this.populateForm(found);
          }
        });
    }
  }

  private populateForm(tx: Transaction): void {
    this.activeTab = 'details';
    this.calcExpression = tx.amount.toString();
    if (tx.tags) {
      this.selectedTags = tx.tags.split(',').map(s => s.trim().replace(/^#/, '')).filter(Boolean);
      this.tagService.addTags(this.selectedTags);
    } else {
      this.selectedTags = [];
    }

    if (tx.attachments && tx.attachments.length > 0) {
      this.attachedFiles = [...tx.attachments];
    } else if (tx.receiptFileName || tx.receiptUrl) {
      this.attachedFiles = [{
        fileName: tx.receiptFileName || 'Attached Document',
        fileUrl: tx.receiptUrl || ''
      }];
    } else {
      this.attachedFiles = [];
    }

    this.form.patchValue({
      title: tx.title,
      amount: tx.amount,
      type: tx.type,
      categoryId: tx.categoryId,
      date: tx.date ? new Date(tx.date) : new Date(),
      time: tx.time || new Date().toTimeString().substring(0, 5),
      paymentMethod: tx.paymentMethod || 'Cash',
      receiptFileName: tx.receiptFileName || '',
      receiptUrl: tx.receiptUrl || '',
      tags: this.selectedTags.join(', ')
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
    this.form.patchValue({ amount: 0 });
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
    this.activeTab = 'details';
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

  submit(): void {
    if (this.form.invalid) return;

    this.errorMessage = '';
    this.isSubmitting = true;
    const val = this.form.getRawValue();
    const timeZoneOffsetInMinutes = new Date().getTimezoneOffset();
    const tagsString = this.selectedTags.join(', ');

    if (this.isEditMode && this.transactionId) {
      this.transactionService.updateTransaction({
        id: this.transactionId,
        title: val.title!,
        amount: Number(val.amount),
        type: Number(val.type),
        categoryId: val.categoryId!,
        accountId: DEFAULT_ACCOUNT_ID,
        date: new Date(val.date!).toISOString(),
        time: val.time || '',
        paymentMethod: val.paymentMethod || 'Cash',
        receiptFileName: val.receiptFileName || '',
        receiptUrl: val.receiptUrl || '',
        tags: tagsString,
        attachments: this.attachedFiles,
        timeZoneOffsetInMinutes
      }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/transactions']);
        },
        error: (err) => { this.isSubmitting = false; this.errorMessage = err.error?.error || 'Failed to save transaction.'; }
      });
    } else {
      this.transactionService.createTransaction({
        title: val.title!,
        amount: Number(val.amount),
        type: Number(val.type),
        categoryId: val.categoryId!,
        accountId: DEFAULT_ACCOUNT_ID,
        date: new Date(val.date!).toISOString(),
        time: val.time || '',
        paymentMethod: val.paymentMethod || 'Cash',
        receiptFileName: val.receiptFileName || '',
        receiptUrl: val.receiptUrl || '',
        tags: tagsString,
        attachments: this.attachedFiles,
        timeZoneOffsetInMinutes
      }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/transactions']);
        },
        error: (err) => { this.isSubmitting = false; this.errorMessage = err.error?.error || 'Failed to save transaction.'; }
      });
    }
  }
}
