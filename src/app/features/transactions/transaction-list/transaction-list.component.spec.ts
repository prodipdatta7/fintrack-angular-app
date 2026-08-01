import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionListComponent } from './transaction-list.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('TransactionListComponent', () => {
  let component: TransactionListComponent;
  let fixture: ComponentFixture<TransactionListComponent>;
  let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;

  beforeEach(async () => {
    transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getTransactions', 'deleteTransaction'], {
      transactions: signal([]),
      totalCount: signal(0),
      isLoading: signal(false)
    });
    transactionServiceSpy.getTransactions.and.returnValue(of({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false }));

    categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories'], {
      categories: signal([])
    });
    categoryServiceSpy.getCategories.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TransactionListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load initial transactions & categories', () => {
    expect(component).toBeTruthy();
    expect(transactionServiceSpy.getTransactions).toHaveBeenCalled();
    expect(categoryServiceSpy.getCategories).toHaveBeenCalled();
  });

  it('should open history drawer for selected transaction ID', () => {
    component.openHistoryDrawer('tx-99');
    expect(component.historyTransactionId).toBe('tx-99');
    expect(component.showHistoryDrawer).toBeTrue();
  });
});
