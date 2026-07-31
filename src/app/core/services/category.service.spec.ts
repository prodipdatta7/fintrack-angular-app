import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoryService } from './category.service';
import { Category, CategoryType } from '../models/category.model';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CategoryService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch categories and update signal state', () => {
    const dummyCategories: Category[] = [
      { id: 'cat-1', name: 'Salary', icon: 'pi-wallet', color: '#10b981', type: CategoryType.Income, userId: 'user-1' }
    ];

    service.getCategories().subscribe(res => {
      expect(res.length).toBe(1);
      expect(service.categories().length).toBe(1);
      expect(service.categories()[0].name).toBe('Salary');
    });

    const req = httpMock.expectOne('http://localhost:5000/api/categories');
    expect(req.request.method).toBe('GET');
    req.flush(dummyCategories);
  });
});
