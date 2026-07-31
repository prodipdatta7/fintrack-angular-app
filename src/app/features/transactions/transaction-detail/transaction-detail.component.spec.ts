import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionDetailComponent } from './transaction-detail.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { CategoryType } from '../../../core/models/category.model';

describe('TransactionDetailComponent', () => {
  let component: TransactionDetailComponent;
  let fixture: ComponentFixture<TransactionDetailComponent>;
  let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;

  const mockTx = {
    id: 'tx-100',
    title: 'Salary Deposit',
    amount: 3500.50,
    type: CategoryType.Income,
    categoryId: 'cat-1',
    accountId: 'acc-1',
    date: '2026-07-31',
    time: '14:30',
    paymentMethod: 'Bank Transfer',
    tags: 'Salary, Work',
    timeZoneOffsetInMinutes: 0,
    userId: 'u1'
  };

  beforeEach(async () => {
    transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getTransactions', 'getTransactionById', 'getTransactionEvents'], {
      transactions: signal([mockTx])
    });
    transactionServiceSpy.getTransactions.and.returnValue(of({ items: [mockTx], totalCount: 1, page: 1, pageSize: 10 } as any));
    transactionServiceSpy.getTransactionById.and.returnValue(of(mockTx as any));
    transactionServiceSpy.getTransactionEvents.and.returnValue(of([]));

    categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories', 'getCategoryById'], {
      categories: signal([{ id: 'cat-1', name: 'Employment', type: CategoryType.Income, userId: 'u1' }])
    });
    categoryServiceSpy.getCategories.and.returnValue(of([]));
    categoryServiceSpy.getCategoryById.and.returnValue(of({ id: 'cat-1', name: 'Employment', type: CategoryType.Income, userId: 'u1' } as any));

    await TestBed.configureTestingModule({
      imports: [TransactionDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['id', 'tx-100']]))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load transaction details', () => {
    expect(component).toBeTruthy();
    expect(component.transaction?.id).toBe('tx-100');
    expect(component.categoryName).toBe('Employment');
    expect(component.tagsList).toEqual(['Salary', 'Work']);
  });

  it('should toggle history drawer for transaction audit trail', () => {
    component.openHistoryDrawer();
    expect(component.historyTransactionId).toBe('tx-100');
    expect(component.showHistoryDrawer).toBeTrue();
  });
});
