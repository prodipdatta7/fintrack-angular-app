import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionEditorComponent } from './transaction-editor.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('TransactionEditorComponent', () => {
  let component: TransactionEditorComponent;
  let fixture: ComponentFixture<TransactionEditorComponent>;
  let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;

  beforeEach(async () => {
    transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getTransactions', 'getTransactionById', 'createTransaction', 'updateTransaction'], {
      transactions: signal([])
    });
    transactionServiceSpy.getTransactions.and.returnValue(of({ items: [], totalCount: 0, page: 1, pageSize: 10 } as any));
    transactionServiceSpy.getTransactionById.and.returnValue(of(null as any));

    categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories'], {
      categories: signal([])
    });
    categoryServiceSpy.getCategories.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TransactionEditorComponent],
      providers: [
        provideRouter([]),
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map())
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize in calculator tab mode', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab).toBe('calculator');
  });

  it('should perform math calculation and update amount form control', () => {
    component.calcAppendDigit('5');
    component.calcAppendOp('+');
    component.calcAppendDigit('5');
    component.calcEqual();

    expect(component.form.get('amount')?.value).toBe(10);
  });
});
