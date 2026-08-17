import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CategorySubnavComponent } from './category-subnav.component';
import { CategoryService } from '../../../core/services/category.service';
import { TagService } from '../../../core/services/tag.service';
import { Category, CategoryType } from '../../../core/models/category.model';

describe('CategorySubnavComponent', () => {
    let fixture: ComponentFixture<CategorySubnavComponent>;
    let component: CategorySubnavComponent;

    const mockCategories: Category[] = [
        { id: '1', name: 'Food', color: '#ff0000', icon: 'fastfood', type: CategoryType.Expense, budgetLimit: 500, userId: 'u1' },
        { id: '2', name: 'Salary', color: '#00ff00', icon: 'payments', type: CategoryType.Income, budgetLimit: 0, userId: 'u1' },
    ];

    beforeEach(async () => {
        const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories'], {
            categories: signal(mockCategories),
        });
        categoryServiceSpy.getCategories.and.returnValue(of(mockCategories));

        const tagServiceSpy = jasmine.createSpyObj('TagService', ['loadTags'], {
            tags: signal(['Groceries', 'Personal', 'Freelance']),
        });
        tagServiceSpy.loadTags.and.returnValue(of(['Groceries', 'Personal', 'Freelance']));

        await TestBed.configureTestingModule({
            imports: [CategorySubnavComponent],
            providers: [
                provideRouter([]),
                { provide: CategoryService, useValue: categoryServiceSpy },
                { provide: TagService, useValue: tagServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CategorySubnavComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should render both navigation tabs', () => {
        const tabs = fixture.nativeElement.querySelectorAll('.subnav-item');
        expect(tabs.length).toBe(2);
        expect(tabs[0].textContent).toContain('Categories');
        expect(tabs[1].textContent).toContain('Tags & Labels');
    });

    it('should display category and tag counts in badges', () => {
        const badges = fixture.nativeElement.querySelectorAll('.subnav-badge');
        expect(badges.length).toBe(2);
        expect(badges[0].textContent.trim()).toBe('2');
        expect(badges[1].textContent.trim()).toBe('3');
    });

    it('should link to /categories and /categories/tags', () => {
        const tabs = fixture.nativeElement.querySelectorAll('.subnav-item');
        expect(tabs[0].getAttribute('href')).toBe('/categories');
        expect(tabs[1].getAttribute('href')).toBe('/categories/tags');
    });
});
