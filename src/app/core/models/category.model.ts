/** Wire values must match the backend enum (FinTrack.Modules.Categories.Domain.CategoryType). */
export enum CategoryType {
    Income = 1,
    Expense = 2,
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
    /** Monthly spending cap. 0 means "no limit". */
    budgetLimit: number;
    userId: string;
}

export interface CreateCategoryRequest {
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
    budgetLimit: number;
}

export interface UpdateCategoryRequest {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
    budgetLimit: number;
}
