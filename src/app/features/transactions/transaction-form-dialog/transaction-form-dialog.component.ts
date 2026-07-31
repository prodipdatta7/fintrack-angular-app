import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryType } from '../../../core/models/category.model';
import { Transaction, TransactionAttachment } from '../../../core/models/transaction.model';
import { TagService } from '../../../core/services/tag.service';

@Component({
  selector: 'app-transaction-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (visible) {
      <div class="modal-overlay">
        <div class="modal-card glass-card">
          <div class="modal-header">
            <h3>
              <i class="pi pi-credit-card glow-text-cyan"></i>
              {{ transactionToEdit ? 'Edit Transaction' : 'Record New Transaction' }}
            </h3>
            <button (click)="close()" class="close-btn"><i class="pi pi-times"></i></button>
          </div>

          <!-- Dialog Tabs -->
          <div class="modal-tabs">
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="activeTab === 'calculator'"
              (click)="activeTab = 'calculator'">
              <i class="pi pi-calculator"></i> 1. Calculator & Amount
              @if (form.get('amount')?.value) {
                <span class="amount-badge">\${{ form.get('amount')?.value }}</span>
              }
            </button>
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="activeTab === 'details'"
              (click)="activeTab = 'details'">
              <i class="pi pi-file-edit"></i> 2. Description & Details
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="modal-form">
            <!-- TAB 1: Calculator -->
            @if (activeTab === 'calculator') {
              <div class="calculator-panel">
                <!-- Audit Calculation History Log -->
                <div class="calc-history-container">
                  <div class="history-header">
                    <span><i class="pi pi-history"></i> Calculation History</span>
                    @if (calcHistory.length > 0) {
                      <button type="button" (click)="clearHistory()" class="clear-history-btn">Clear Log</button>
                    }
                  </div>
                  <div class="history-list">
                    @for (item of calcHistory; track $index) {
                      <div class="history-row" (click)="useHistoryValue(item)" title="Click to use this result">
                        <span class="history-expr">{{ item.expression }} =</span>
                        <span class="history-res">\${{ item.result }}</span>
                      </div>
                    } @empty {
                      <div class="history-empty">No calculations logged yet</div>
                    }
                  </div>
                </div>

                <div class="calc-display-container">
                  <div class="calc-expression">{{ calcExpression || '0' }}</div>
                  <div class="calc-result">
                    <span class="currency-symbol">$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      formControlName="amount" 
                      class="calc-amount-input"
                      placeholder="0.00" />
                  </div>
                </div>

                <div class="calc-grid">
                  <button type="button" (click)="calcClear()" class="calc-btn btn-func">AC</button>
                  <button type="button" (click)="calcBackspace()" class="calc-btn btn-func">⌫</button>
                  <button type="button" (click)="calcAppendOp('%')" class="calc-btn btn-func">%</button>
                  <button type="button" (click)="calcAppendOp('/')" class="calc-btn btn-op">÷</button>

                  <button type="button" (click)="calcAppendDigit('7')" class="calc-btn">7</button>
                  <button type="button" (click)="calcAppendDigit('8')" class="calc-btn">8</button>
                  <button type="button" (click)="calcAppendDigit('9')" class="calc-btn">9</button>
                  <button type="button" (click)="calcAppendOp('*')" class="calc-btn btn-op">×</button>

                  <button type="button" (click)="calcAppendDigit('4')" class="calc-btn">4</button>
                  <button type="button" (click)="calcAppendDigit('5')" class="calc-btn">5</button>
                  <button type="button" (click)="calcAppendDigit('6')" class="calc-btn">6</button>
                  <button type="button" (click)="calcAppendOp('-')" class="calc-btn btn-op">-</button>

                  <button type="button" (click)="calcAppendDigit('1')" class="calc-btn">1</button>
                  <button type="button" (click)="calcAppendDigit('2')" class="calc-btn">2</button>
                  <button type="button" (click)="calcAppendDigit('3')" class="calc-btn">3</button>
                  <button type="button" (click)="calcAppendOp('+')" class="calc-btn btn-op">+</button>

                  <button type="button" (click)="calcAppendDigit('0')" class="calc-btn btn-zero">0</button>
                  <button type="button" (click)="calcAppendDigit('.')" class="calc-btn">.</button>
                  <button type="button" (click)="calcEqual()" class="calc-btn btn-equals">=</button>
                </div>

                <button 
                  type="button" 
                  (click)="applyCalculatedAmountAndNext()" 
                  class="btn-apply-next">
                  <i class="pi pi-check"></i> Apply Amount & Proceed to Details →
                </button>
              </div>
            }

            <!-- TAB 2: Details -->
            @if (activeTab === 'details') {
              <div class="details-panel">
                <div class="form-group">
                  <label for="title">Title / Description</label>
                  <textarea id="title" formControlName="title" rows="3" placeholder="e.g. Grocery Shopping, Monthly Salary notes..."></textarea>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="amountDetails">Total Amount ($)</label>
                    <input id="amountDetails" type="number" step="0.01" formControlName="amount" placeholder="0.00" />
                  </div>

                  <div class="form-group">
                    <label for="type">Transaction Type</label>
                    <select id="type" formControlName="type">
                      <option [value]="0">Income 🟢</option>
                      <option [value]="1">Expense 🔴</option>
                    </select>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="categoryId">Category</label>
                    <select id="categoryId" formControlName="categoryId">
                      <option value="" disabled>Select Category</option>
                      @for (cat of categoryService.categories(); track cat.id) {
                        <option [value]="cat.id">{{ cat.name }} ({{ cat.type === 0 ? 'Income' : 'Expense' }})</option>
                      }
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="paymentMethodDialog">Payment Method</label>
                    <select id="paymentMethodDialog" formControlName="paymentMethod">
                      <option value="Cash">Cash 💵</option>
                      <option value="Credit Card">Credit Card 💳</option>
                      <option value="Debit Card">Debit Card 💳</option>
                      <option value="Bank Transfer">Bank Transfer 🏛️</option>
                      <option value="Mobile Payment">Mobile Payment 📱</option>
                      <option value="Crypto">Crypto 🪙</option>
                      <option value="Other">Other 🌐</option>
                    </select>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="dateDialog">Date</label>
                    <input id="dateDialog" type="date" formControlName="date" />
                  </div>

                  <div class="form-group">
                    <label for="timeDialog">Time</label>
                    <input id="timeDialog" type="time" formControlName="time" />
                  </div>
                </div>

                <div class="form-group">
                  <label>Tags / Labels (Global)</label>
                  
                  <!-- Attached Tags Chips -->
                  @if (selectedTags.length > 0) {
                    <div class="attached-tags-container">
                      <span class="tags-hint">Attached Tags:</span>
                      <div class="active-chips">
                        @for (tag of selectedTags; track tag) {
                          <span class="active-tag-chip">
                            #{{ tag }}
                            <button type="button" (click)="removeTag(tag)" class="remove-chip-btn" title="Remove tag">
                              <i class="pi pi-times"></i>
                            </button>
                          </span>
                        }
                      </div>
                    </div>
                  }

                  <!-- Global Tag Suggestions -->
                  <div class="global-tags-bar">
                    <span class="tags-hint">Click global tags to attach:</span>
                    <div class="chips-container">
                      @for (gt of tagService.tags(); track gt) {
                        <button 
                          type="button" 
                          class="tag-chip" 
                          [class.selected]="isTagSelected(gt)"
                          (click)="toggleTag(gt)">
                          #{{ gt }}
                          @if (isTagSelected(gt)) { <i class="pi pi-check"></i> }
                        </button>
                      }
                    </div>
                  </div>

                  <div class="custom-tag-input-row">
                    <input 
                      #newTagInputDialog 
                      type="text" 
                      placeholder="Type tag text & press Enter to create badge..." 
                      (keydown)="onTagInputKeydown($event, newTagInputDialog)"
                      (blur)="addCustomTagsFromInput(newTagInputDialog)" />
                    <button type="button" (click)="addCustomTagsFromInput(newTagInputDialog)" class="btn-add-tag">
                      <i class="pi pi-plus"></i> Attach Tag
                    </button>
                  </div>
                </div>

                <div class="form-group">
                  <label>Transcripts / Attachments (Receipts, Invoices, Documents)</label>
                  <div class="file-upload-box">
                    <label for="receiptUploadDialog" class="upload-label">
                      <i class="pi pi-cloud-upload upload-icon"></i>
                      <span>Click or drag to attach files (Images, PDF, DOCX...)</span>
                    </label>
                    <input id="receiptUploadDialog" type="file" multiple (change)="onFilesSelected($event)" accept="image/*,.pdf,.docx,.doc" class="hidden-file-input" />
                  </div>

                  @if (attachedFiles.length > 0) {
                    <div class="attachments-list">
                      @for (file of attachedFiles; track $index) {
                        <div class="uploaded-file-chip">
                          <i [class]="getAttachmentIcon(file.fileName)" class="file-icon"></i>
                          <span class="file-name" [title]="file.fileName">{{ file.fileName }}</span>
                          <button type="button" (click)="removeAttachedFile($index)" class="remove-file-btn" title="Remove attachment">
                            <i class="pi pi-times"></i>
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Modal Footer Actions -->
            <div class="modal-actions">
              <button type="button" (click)="close()" class="btn-secondary">Cancel</button>
              @if (activeTab === 'calculator') {
                <button type="button" (click)="activeTab = 'details'" class="btn-secondary">Next: Details →</button>
              }
              <button type="submit" [disabled]="form.invalid || isSubmitting" class="btn-primary">
                <i class="pi pi-save"></i>
                {{ transactionToEdit ? 'Update Transaction' : 'Save Transaction' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-card {
      width: 100%;
      max-width: 520px;
      padding: 1.75rem;
      border-radius: 16px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .modal-header h3 {
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.2rem;
      cursor: pointer;
    }

    /* Tabs Styling */
    .modal-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      background: rgba(15, 23, 42, 0.6);
      padding: 0.25rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.6rem 0.75rem;
      background: transparent;
      border: none;
      color: #94a3b8;
      font-weight: 500;
      font-size: 0.85rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tab-btn.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.25));
      color: #f8fafc;
      border: 1px solid rgba(99, 102, 241, 0.4);
      box-shadow: 0 0 12px rgba(99, 102, 241, 0.2);
    }
    .amount-badge {
      background: rgba(6, 182, 212, 0.2);
      color: #22d3ee;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Calculator Panel */
    .calculator-panel {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .calc-history-container {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 0.6rem 0.85rem;
    }
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 0.35rem;
    }
    .clear-history-btn {
      background: transparent;
      border: none;
      color: #f43f5e;
      font-size: 0.7rem;
      cursor: pointer;
    }
    .history-list {
      max-height: 75px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .history-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.78rem;
      padding: 0.2rem 0.4rem;
      border-radius: 5px;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.03);
      transition: background 0.15s ease;
    }
    .history-row:hover {
      background: rgba(99, 102, 241, 0.15);
    }
    .history-expr { color: #cbd5e1; }
    .history-res { color: #38bdf8; font-weight: 600; }
    .history-empty { font-size: 0.75rem; color: #64748b; font-style: italic; }

    .calc-display-container {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      text-align: right;
    }
    .calc-expression {
      font-size: 0.85rem;
      color: #94a3b8;
      min-height: 1.2rem;
      overflow-x: auto;
      white-space: nowrap;
    }
    .calc-result {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.25rem;
    }
    .currency-symbol {
      font-size: 1.25rem;
      font-weight: 700;
      color: #38bdf8;
    }
    .calc-amount-input {
      background: transparent;
      border: none;
      color: #f8fafc;
      font-size: 1.35rem;
      font-weight: 700;
      text-align: right;
      width: 100%;
      outline: none;
    }
    .calc-amount-input::-webkit-inner-spin-button,
    .calc-amount-input::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .calc-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.45rem;
    }
    .calc-btn {
      background: rgba(30, 41, 59, 0.7);
      color: #f1f5f9;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 0.6rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .calc-btn:hover {
      background: rgba(51, 65, 85, 0.9);
      border-color: rgba(99, 102, 241, 0.4);
    }
    .calc-btn:active {
      transform: scale(0.96);
    }
    .btn-zero {
      grid-column: span 2;
    }
    .btn-op {
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
      border-color: rgba(99, 102, 241, 0.3);
    }
    .btn-equals {
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      color: #fff;
      border: none;
      grid-row: span 2;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-danger {
      background: rgba(244, 63, 94, 0.2);
      color: #f43f5e;
      border-color: rgba(244, 63, 94, 0.3);
    }
    .btn-action {
      background: rgba(234, 179, 8, 0.2);
      color: #facc15;
      border-color: rgba(234, 179, 8, 0.3);
    }
    .btn-apply-next {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(6, 182, 212, 0.3));
      border: 1px solid rgba(6, 182, 212, 0.5);
      color: #38bdf8;
      padding: 0.75rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }
    .btn-apply-next:hover {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.5), rgba(6, 182, 212, 0.5));
      color: #fff;
    }

    /* Details Panel */
    .details-panel {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .form-row .form-group {
      flex: 1;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .form-group label {
      font-size: 0.85rem;
      color: #cbd5e1;
    }

    .file-upload-box {
      border: 2px dashed rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 0.85rem;
      text-align: center;
      background: rgba(15, 23, 42, 0.4);
      transition: all 0.2s ease;
    }
    .file-upload-box:hover {
      border-color: var(--cyan-accent);
      background: rgba(6, 182, 212, 0.05);
    }
    .upload-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;
      color: #94a3b8;
      font-size: 0.8rem;
    }
    .upload-icon {
      font-size: 1.3rem;
      color: var(--cyan-accent);
    }
    .hidden-file-input {
      display: none;
    }
    .uploaded-file {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.4rem 0.65rem;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 6px;
      color: #f8fafc;
      font-size: 0.8rem;
    }
    .remove-file-btn {
      background: transparent;
      border: none;
      color: #f43f5e;
      cursor: pointer;
      font-size: 0.95rem;
    }

    .attachments-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .uploaded-file-chip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.4rem 0.75rem;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 8px;
      font-size: 0.85rem;
      color: #f8fafc;
    }
    .uploaded-file-chip .file-icon {
      color: #38bdf8;
      font-size: 1rem;
      margin-right: 0.5rem;
    }

    .attached-tags-container {
      background: rgba(99, 102, 241, 0.1);
      border: 1px dashed rgba(99, 102, 241, 0.3);
      border-radius: 10px;
      padding: 0.5rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 0.5rem;
    }
    .active-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .active-tag-chip {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(6, 182, 212, 0.3));
      color: #38bdf8;
      border: 1px solid rgba(6, 182, 212, 0.5);
      border-radius: 16px;
      padding: 0.2rem 0.55rem;
      font-size: 0.8rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .remove-chip-btn {
      background: transparent;
      border: none;
      color: #cbd5e1;
      cursor: pointer;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      padding: 0;
      transition: color 0.15s ease;
    }
    .remove-chip-btn:hover {
      color: #f43f5e;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      border: none;
      border-radius: 8px;
      padding: 0.6rem 1.2rem;
      cursor: pointer;
    }
  `]
})
export class TransactionFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() transactionToEdit: Transaction | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);
  categoryService = inject(CategoryService);
  tagService = inject(TagService);

  activeTab: 'calculator' | 'details' = 'calculator';
  isSubmitting = false;
  calcExpression = '';
  attachedFiles: TransactionAttachment[] = [];
  calcHistory: Array<{ expression: string; result: number }> = [];
  selectedTags: string[] = [];

  form = this.fb.group({
    title: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    type: [CategoryType.Expense, Validators.required],
    categoryId: ['', Validators.required],
    date: [new Date().toISOString().substring(0, 10), Validators.required],
    time: [new Date().toTimeString().substring(0, 5)],
    paymentMethod: ['Cash'],
    receiptFileName: [''],
    receiptUrl: [''],
    tags: ['']
  });

  isTagSelected(tag: string): boolean {
    return this.selectedTags.some(t => t.toLowerCase() === tag.toLowerCase());
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

  addCustomTagsFromInput(inputEl: HTMLInputElement): void {
    const raw = inputEl.value.trim();
    if (!raw) return;
    const parts = raw.split(/[,;\s]+/).map(s => s.trim().replace(/^#/, '')).filter(Boolean);
    let updated = [...this.selectedTags];
    parts.forEach(part => {
      const added = this.tagService.addTag(part);
      if (added && !updated.some(t => t.toLowerCase() === added.toLowerCase())) {
        updated = [...updated, added];
      }
    });
    this.selectedTags = updated;
    this.form.patchValue({ tags: this.selectedTags.join(', ') });
    inputEl.value = '';
  }

  onTagInputKeydown(event: KeyboardEvent, inputEl: HTMLInputElement): void {
    if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      this.addCustomTagsFromInput(inputEl);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactionToEdit'] && this.transactionToEdit) {
      this.activeTab = 'details';
      this.calcExpression = this.transactionToEdit.amount.toString();
      if (this.transactionToEdit.tags) {
        this.selectedTags = this.transactionToEdit.tags.split(',').map(s => s.trim().replace(/^#/, '')).filter(Boolean);
        this.tagService.addTags(this.selectedTags);
      } else {
        this.selectedTags = [];
      }
      if (this.transactionToEdit.attachments && this.transactionToEdit.attachments.length > 0) {
        this.attachedFiles = [...this.transactionToEdit.attachments];
      } else if (this.transactionToEdit.receiptFileName || this.transactionToEdit.receiptUrl) {
        this.attachedFiles = [{
          fileName: this.transactionToEdit.receiptFileName || 'Attached Document',
          fileUrl: this.transactionToEdit.receiptUrl || ''
        }];
      } else {
        this.attachedFiles = [];
      }
      this.form.patchValue({
        title: this.transactionToEdit.title,
        amount: this.transactionToEdit.amount,
        type: this.transactionToEdit.type,
        categoryId: this.transactionToEdit.categoryId,
        date: this.transactionToEdit.date ? new Date(this.transactionToEdit.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
        time: this.transactionToEdit.time || new Date().toTimeString().substring(0, 5),
        paymentMethod: this.transactionToEdit.paymentMethod || 'Cash',
        receiptFileName: this.transactionToEdit.receiptFileName || '',
        receiptUrl: this.transactionToEdit.receiptUrl || '',
        tags: this.selectedTags.join(', ')
      });
    } else if (changes['visible'] && this.visible && !this.transactionToEdit) {
      this.activeTab = 'calculator';
      this.calcExpression = '';
      this.selectedTags = [];
      this.attachedFiles = [];
      this.form.reset({
        title: '',
        amount: 0,
        type: CategoryType.Expense,
        categoryId: '',
        date: new Date().toISOString().substring(0, 10),
        time: new Date().toTimeString().substring(0, 5),
        paymentMethod: 'Cash',
        receiptFileName: '',
        receiptUrl: '',
        tags: ''
      });
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
    if (/\.(jpg|jpeg|jpe|png|gif|webp|svg)$/.test(n)) return 'pi pi-image';
    if (/\.pdf$/.test(n)) return 'pi pi-file-pdf';
    if (/\.(docx|doc)$/.test(n)) return 'pi pi-file-word';
    return 'pi pi-file';
  }

  // Calculator helper methods
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
      const result = Function(`"use strict"; return (${sanitized})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
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
      // Invalid input ignored during typing
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  submit(): void {
    if (this.form.invalid) return;

    this.isSubmitting = true;
    const val = this.form.getRawValue();
    const timeZoneOffsetInMinutes = new Date().getTimezoneOffset();
    const tagsString = this.selectedTags.join(', ');

    if (this.transactionToEdit) {
      this.transactionService.updateTransaction({
        id: this.transactionToEdit.id,
        title: val.title!,
        amount: Number(val.amount),
        type: Number(val.type),
        categoryId: val.categoryId!,
        accountId: this.transactionToEdit.accountId || 'default-account',
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
          this.close();
        },
        error: () => { this.isSubmitting = false; }
      });
    } else {
      this.transactionService.createTransaction({
        title: val.title!,
        amount: Number(val.amount),
        type: Number(val.type),
        categoryId: val.categoryId!,
        accountId: 'default-account',
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
          this.close();
        },
        error: () => { this.isSubmitting = false; }
      });
    }
  }
}
