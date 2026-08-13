export interface SavingsPlan {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    /** Hex color used by the plan card accent. */
    color: string;
    /** ISO date the goal is aimed at. */
    deadline: string;
}

export interface CreatePlanRequest {
    title: string;
    targetAmount: number;
    currentAmount: number;
    color: string;
    deadline: string;
}

export interface UpdatePlanRequest extends CreatePlanRequest {
    id: string;
}

export interface DepositRequest {
    amount: number;
}
