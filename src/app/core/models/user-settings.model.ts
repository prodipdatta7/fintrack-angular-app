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
    email: string;
    firstName: string;
    lastName: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface ExportDataRequest {
    fromDate?: string;
    toDate?: string;
}
