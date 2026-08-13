export interface UserSettings {
    currency: string;
    timeZone: string;
    dateFormat: string;
    defaultPageSize: number;
    emailNotifications: boolean;
    budgetAlerts: boolean;
    budgetAlertThreshold: number | null;
}

export interface UpdateProfileRequest {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
}

export interface ExportDataRequest {
    fromDate?: string;
    toDate?: string;
}
