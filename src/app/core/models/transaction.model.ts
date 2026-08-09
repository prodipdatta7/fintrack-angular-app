import { CategoryType } from './category.model';

export interface TransactionAttachment {
    fileName: string;
    fileUrl: string;
}

export interface Transaction {
    id: string;
    title: string;
    amount: number;
    type: CategoryType;
    categoryId: string;
    accountId: string;
    date: string;
    time?: string;
    paymentMethod?: string;
    receiptFileName?: string;
    receiptUrl?: string;
    tags?: string;
    attachments?: TransactionAttachment[];
    timeZoneOffsetInMinutes: number;
    userId: string;
    createdBy?: string;
    createdAt?: string;
}

export interface CreateTransactionRequest {
    title: string;
    amount: number;
    type: CategoryType;
    categoryId: string;
    accountId: string;
    date?: string;
    time?: string;
    paymentMethod?: string;
    receiptFileName?: string;
    receiptUrl?: string;
    tags?: string;
    attachments?: TransactionAttachment[];
    timeZoneOffsetInMinutes?: number;
}

export interface UpdateTransactionRequest {
    id: string;
    title: string;
    amount: number;
    type: CategoryType;
    categoryId: string;
    accountId: string;
    date?: string;
    time?: string;
    paymentMethod?: string;
    receiptFileName?: string;
    receiptUrl?: string;
    tags?: string;
    attachments?: TransactionAttachment[];
    timeZoneOffsetInMinutes?: number;
}

export interface TransactionPagedResult {
    items: Transaction[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
