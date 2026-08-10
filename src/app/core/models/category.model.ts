export enum CategoryType {
    Income = 0,
    Expense = 1,
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
    userId: string;
}

export interface CreateCategoryRequest {
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
}

export interface UpdateCategoryRequest {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
}
