export interface TransactionEvent {
    id: string;
    transactionId: string;
    eventType: 'TransactionCreated' | 'TransactionUpdated' | 'TransactionDeleted' | string;
    occurredOnUtc: string;
    summary: string;
    /** Human-readable description of what changed. */
    detail: string;
    /** Display name / email of the operator behind the event. */
    performedBy: string;
    dataJson: string;
}
