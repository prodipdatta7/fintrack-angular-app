import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CategoryDetailComponent } from './category-detail.component';
import { CategoryService } from '../../../core/services/category.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { TagService } from '../../../core/services/tag.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, CategoryType } from '../../../core/models/category.model';
import { Transaction } from '../../../core/models/transaction.model';

const category: Category = {
    id: 'cat-1',
    name: 'Groceries & Dining',
    icon: '🛒',
    color: '#10b981',
    type: CategoryType.Expense,
    budgetLimit: 850,
    userId: 'u-1',
};

const transaction: Transaction = {
    id: 'tx-1',
    title: 'Whole Foods Market',
    amount: 184.5,
    type: CategoryType.Expense,
    categoryId: 'cat-1',
    accountId: 'acc-1',
    date: '2026-08-04T00:00:00Z',
    note: 'Weekly groceries',
    timeZoneOffsetInMinutes: 0,
    userId: 'u-1',
};

const paged = (items: Transaction[]) => ({
    items,
    totalCount: items.length,
    page: 1,
    pageSize: 25,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
});

describe('CategoryDetailComponent', () => {
    let fixture: ComponentFixture<CategoryDetailComponent>;
    let component: CategoryDetailComponent;
    let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
    let dashboardServiceSpy: jasmine.SpyObj<DashboardService>;
    let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
    let tagService: TagService;
    let toastService: ToastService;

    function createTagServiceMock(): jasmine.SpyObj<TagService> {
        const tags = signal<string[]>([]);
        const categoryTags = signal<Record<string, string[]>>({});
        const setCategoryTags = (id: string, names: string[]) => {
            categoryTags.set({ ...categoryTags(), [id]: names });
        };

        const mock = jasmine.createSpyObj(
            'TagService',
            [
                'loadTags',
                'loadCategoryTags',
                'tagsForCategory',
                'isTagAssignedToCategory',
                'createTagForCategory',
                'createTag',
                'assignTagToCategory',
                'unassignTagFromCategory',
            ],
            { tags, categoryTags, isLoading: signal(false) },
        );

        mock.tagsForCategory.and.callFake((id: string) => categoryTags()[id] ?? []);
        mock.isTagAssignedToCategory.and.callFake((id: string, tag: string) =>
            (categoryTags()[id] ?? []).some((t) => t.toLowerCase() === tag.toLowerCase()),
        );
        mock.loadTags.and.callFake(() => of(tags()));
        mock.loadCategoryTags.and.callFake((id: string) => of(categoryTags()[id] ?? []));
        mock.createTag.and.callFake((tag: string) => {
            const name = tag.trim().replace(/^#/, '');
            if (!name) return of(null);
            if (!tags().some((t) => t.toLowerCase() === name.toLowerCase())) {
                tags.set([...tags(), name]);
            }
            return of(name);
        });
        mock.createTagForCategory.and.callFake((tag: string, categoryId: string) => {
            const name = tag.trim().replace(/^#/, '');
            if (!name) return of(null);
            if (!tags().some((t) => t.toLowerCase() === name.toLowerCase())) {
                tags.set([...tags(), name]);
            }
            const current = categoryTags()[categoryId] ?? [];
            if (!current.some((t) => t.toLowerCase() === name.toLowerCase())) {
                setCategoryTags(categoryId, [...current, name]);
            }
            return of(name);
        });
        mock.assignTagToCategory.and.callFake((categoryId: string, tag: string) => {
            const current = categoryTags()[categoryId] ?? [];
            if (!current.some((t) => t.toLowerCase() === tag.toLowerCase())) {
                setCategoryTags(categoryId, [...current, tag]);
            }
            return of(undefined);
        });
        mock.unassignTagFromCategory.and.callFake((categoryId: string, tag: string) => {
            setCategoryTags(
                categoryId,
                (categoryTags()[categoryId] ?? []).filter((t) => t.toLowerCase() !== tag.toLowerCase()),
            );
            return of(undefined);
        });

        return mock;
    }

    beforeEach(async () => {
        const tagServiceMock = createTagServiceMock();

        categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategoryById', 'getCategories'], {
            categories: signal([category]),
        });
        categoryServiceSpy.getCategoryById.and.returnValue(of(category));
        categoryServiceSpy.getCategories.and.returnValue(of([category]));

        dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getSummary']);
        dashboardServiceSpy.getSummary.and.returnValue(
            of({
                totalIncome: 6200,
                totalExpense: 184.5,
                netSavings: 6015.5,
                categorySpent: [{ categoryId: 'cat-1', spent: 184.5 }],
                recentTransactions: [],
                transactionCount: 1,
            }),
        );

        transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['queryTransactions']);
        transactionServiceSpy.queryTransactions.and.returnValue(of(paged([transaction])));

        await TestBed.configureTestingModule({
            imports: [CategoryDetailComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                ToastService,
                { provide: TagService, useValue: tagServiceMock },
                { provide: CategoryService, useValue: categoryServiceSpy },
                { provide: DashboardService, useValue: dashboardServiceSpy },
                { provide: TransactionService, useValue: transactionServiceSpy },
                {
                    provide: ActivatedRoute,
                    useValue: { paramMap: of(convertToParamMap({ id: 'cat-1' })) },
                },
            ],
        }).compileComponents();

        tagService = TestBed.inject(TagService);
        toastService = TestBed.inject(ToastService);
        fixture = TestBed.createComponent(CategoryDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => toastService.clear());

    it('should load the category named in the route', () => {
        expect(categoryServiceSpy.getCategoryById).toHaveBeenCalledWith('cat-1');
        expect(component.category()?.name).toBe('Groceries & Dining');
        expect(fixture.nativeElement.querySelector('.category-title').textContent.trim()).toBe('Groceries & Dining');
    });

    it('should compute spend, percent and remaining from the aggregate summary', () => {
        expect(component.spent()).toBe(184.5);
        expect(component.percent()).toBe(22);
        expect(component.remaining()).toBe(665.5);
        expect(component.isOverBudget()).toBeFalse();
    });

    it('should query the ledger scoped to the category without touching shared list state', () => {
        expect(transactionServiceSpy.queryTransactions).toHaveBeenCalledWith(1, 25, 'cat-1');
        expect(fixture.nativeElement.querySelectorAll('.ledger tbody tr').length).toBe(1);
    });

    it('should navigate to the transaction detail page on row click', () => {
        const router = TestBed.inject(Router);
        const navigateSpy = spyOn(router, 'navigate');
        component.openTransaction('tx-1');
        expect(navigateSpy).toHaveBeenCalledWith(['/transactions/details', 'tx-1']);
    });

    it('should deep link to the transaction editor prefilled with this category', () => {
        const router = TestBed.inject(Router);
        const navigateSpy = spyOn(router, 'navigate');
        component.recordTransaction();
        expect(navigateSpy).toHaveBeenCalledWith(['/transactions/new'], {
            queryParams: { categoryId: 'cat-1' },
        });
    });

    it('should open the edit dialog prefilled with the loaded category', () => {
        component.openEdit();
        expect(component.showDialog).toBeTrue();
        expect(component.editingCategory?.id).toBe('cat-1');
    });

    it('should create a tag under this category and bind it', () => {
        component.onTagInputChange('Client Dinner');
        component.createTag();
        expect(tagService.tagsForCategory('cat-1')).toContain('Client Dinner');
        expect(component.assignedTags()).toContain('Client Dinner');
        expect(component.tagInput()).toBe('');
    });
    it('should reject an empty tag name', () => {
        component.onTagInputChange('   ');
        component.createTag();
        expect(tagService.tagsForCategory('cat-1').length).toBe(0);
        expect(toastService.toasts()[0].type).toBe('error');
    });

    it('should assign an existing global tag and unassign it again', () => {
        tagService.createTag('Travel').subscribe();
        component.assignTag('Travel');
        expect(component.assignedTags()).toContain('Travel');

        component.unassignTag('Travel');
        expect(component.assignedTags()).not.toContain('Travel');
        expect(tagService.tags()).toContain('Travel');
    });

    it('should expose unassigned global tags as assignable options', () => {
        tagService.createTagForCategory('Dining Out', 'cat-1').subscribe();
        tagService.createTag('Reimbursable').subscribe();
        expect(component.availableTags()).toContain('Reimbursable');
        expect(component.availableTags()).not.toContain('Dining Out');
    });

    it('should show a not-found card for an unknown category', () => {
        categoryServiceSpy.getCategoryById.and.returnValue(throwError(() => new Error('404')));
        categoryServiceSpy.categories.set([]);

        const second = TestBed.createComponent(CategoryDetailComponent);
        second.detectChanges();

        expect(second.componentInstance.notFound()).toBeTrue();
        expect(second.nativeElement.querySelector('.category-missing')).toBeTruthy();
    });
});
