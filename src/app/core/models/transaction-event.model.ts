export interface TransactionEvent {
  id: string;
  transactionId: string;
  eventType: 'TransactionCreated' | 'TransactionUpdated' | 'TransactionDeleted' | string;
  occurredOnUtc: string;
  summary: string;
  dataJson: string;
}
