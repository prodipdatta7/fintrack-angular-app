export interface AssistantConversation {
    id: string;
    title: string;
    isPinned: boolean;
    createdAt: string;
    lastMessageAt: string;
    messageCount: number;
}

export interface AssistantMessage {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    actionType?: string;
    actionStatus?: 'Proposed' | 'Confirmed' | 'Cancelled' | 'Executed';
    actionSummary?: string;
    actionPayloadJson?: string;
    toolCallJson?: string;
    toolResultJson?: string;
    createdAt: string;
}

export interface ConversationListResult {
    items: AssistantConversation[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export interface ConversationDetail {
    id: string;
    title: string;
    isPinned: boolean;
    createdAt: string;
    lastMessageAt: string;
    messages: AssistantMessage[];
}

export interface ProposedAction<T = any> {
    actionType: string;
    status: 'Proposed' | 'Confirmed' | 'Cancelled' | 'Executed';
    summary: string;
    payload: T;
}

export interface ProposedCreateTransactionPayload {
    amount: number;
    type: string;
    categoryId?: string;
    categoryName?: string;
    accountId?: string;
    accountName?: string;
    title: string;
    date: string;
    note?: string;
}

export interface ProposedTransferPayload {
    amount: number;
    fromAccountId: string;
    fromAccountName: string;
    toAccountId: string;
    toAccountName: string;
    date: string;
    note?: string;
}

export interface ProposedCreateAccountPayload {
    name: string;
    accountType: string;
    initialBalance: number;
    currency: string;
    color: string;
    alreadyExists: boolean;
}

export interface ProposedCreateCategoryPayload {
    name: string;
    type: string;
    icon: string;
    color: string;
    budgetLimit?: number;
    alreadyExists: boolean;
}

export interface ProposedCreateTagPayload {
    name: string;
    normalizedName: string;
    alreadyExists: boolean;
}

export interface ProposedCreateSavingsPlanPayload {
    title: string;
    targetAmount: number;
    initialAmount: number;
    deadline: string;
    color: string;
}

export interface ToolDefinition {
    name: string;
    description: string;
    parametersSchemaJson: string;
}

export interface VoiceTurnResult {
    messageId: string;
    conversationId: string;
    userTranscript: string;
    assistantReply: string;
    actionType?: string;
    actionStatus?: string;
    actionSummary?: string;
    actionPayloadJson?: string;
    toolName?: string;
}
