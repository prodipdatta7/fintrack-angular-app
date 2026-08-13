import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../models/category.model';

@Injectable({
    providedIn: 'root',
})
export class CategoryService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    categories = signal<Category[]>([]);
    isLoading = signal<boolean>(false);

    getCategories(): Observable<Category[]> {
        this.isLoading.set(true);
        return this.http.get<Category[]>(`${this.apiUrl}/get-categories`).pipe(
            tap((items: Category[]) => {
                this.categories.set(items);
            }),
            finalize(() => this.isLoading.set(false)),
        );
    }

    getCategoryById(id: string): Observable<Category> {
        return this.http.get<Category>(`${this.apiUrl}/get-category/${id}`);
    }

    createCategory(req: CreateCategoryRequest): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/create-category`, req);
    }

    updateCategory(req: UpdateCategoryRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/update-category/${req.id}`, req);
    }
}
