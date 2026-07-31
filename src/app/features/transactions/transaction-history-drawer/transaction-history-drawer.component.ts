import { Component, DestroyRef, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionEvent } from '../../../core/models/transaction-event.model';

@Component({
  selector: 'app-transaction-history-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="drawer-overlay" (click)="close()">
        <div class="drawer-panel glass-card" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <div>
              <h3><i class="pi pi-history glow-text-cyan"></i> Audit Trail & Event History</h3>
              <p class="subtitle">Event Sourcing Stream for Transaction <code>#{{ transactionId }}</code></p>
            </div>
            <button (click)="close()" class="close-btn"><i class="pi pi-times"></i></button>
          </div>

          <div class="drawer-body">
            @if (isLoading) {
              <div class="loading-state">
                <i class="pi pi-spin pi-spinner glow-text-indigo" style="font-size: 2rem;"></i>
                <span>Fetching event sourcing stream...</span>
              </div>
            } @else {
              <div class="timeline">
                @for (event of events; track event.id) {
                  <div class="timeline-item">
                    <div class="timeline-badge" [class]="getEventTypeClass(event.eventType)">
                      <i class="pi" [class]="getEventTypeIcon(event.eventType)"></i>
                    </div>
                    <div class="timeline-content glass-card">
                      <div class="event-header">
                        <span class="event-type" [class]="getEventTypeClass(event.eventType)">{{ event.eventType }}</span>
                        <span class="event-time">{{ event.occurredOnUtc | date:'medium' }}</span>
                      </div>
                      <p class="event-summary">{{ event.summary }}</p>
                      @if (event.dataJson) {
                        <details class="json-details">
                          <summary>View Event Data Payload</summary>
                          <pre><code>{{ formatJson(event.dataJson) }}</code></pre>
                        </details>
                      }
                    </div>
                  </div>
                } @empty {
                  <div class="empty-state">
                    <i class="pi pi-history" style="font-size: 2rem; color: #64748b;"></i>
                    <p>No audit events found for this transaction.</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(6px);
      display: flex;
      justify-content: flex-end;
      z-index: 1100;
    }
    .drawer-panel {
      width: 100%;
      max-width: 520px;
      height: 100vh;
      display: flex;
      flex-direction: column;
      border-radius: 0;
      border-left: 1px solid rgba(99, 102, 241, 0.3);
      padding: 1.75rem;
    }
    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .drawer-header h3 {
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .subtitle {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }
    .close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.2rem;
      cursor: pointer;
    }
    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding-top: 1.5rem;
    }
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      position: relative;
      padding-left: 1.5rem;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 14px;
      top: 10px;
      bottom: 10px;
      width: 2px;
      background: rgba(255, 255, 255, 0.1);
    }
    .timeline-item {
      position: relative;
      display: flex;
      gap: 1rem;
    }
    .timeline-badge {
      position: absolute;
      left: -1.5rem;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      z-index: 2;
    }
    .timeline-badge.created {
      background: #10b981;
      color: #fff;
    }
    .timeline-badge.updated {
      background: #6366f1;
      color: #fff;
    }
    .timeline-badge.deleted {
      background: #f43f5e;
      color: #fff;
    }
    .timeline-content {
      flex: 1;
      padding: 1rem;
    }
    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .event-type {
      font-weight: 700;
      font-size: 0.85rem;
    }
    .event-type.created { color: #10b981; }
    .event-type.updated { color: #818cf8; }
    .event-type.deleted { color: #f43f5e; }
    .event-time {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .event-summary {
      font-size: 0.9rem;
      color: #e2e8f0;
      line-height: 1.4;
    }
    .json-details {
      margin-top: 0.75rem;
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .json-details summary {
      cursor: pointer;
    }
    .json-details pre {
      background: rgba(0, 0, 0, 0.4);
      padding: 0.5rem;
      border-radius: 6px;
      margin-top: 0.4rem;
      overflow-x: auto;
      color: #38bdf8;
    }
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      color: #94a3b8;
    }
  `]
})
export class TransactionHistoryDrawerComponent implements OnChanges {
  @Input() visible = false;
  @Input() transactionId: string | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly transactionService = inject(TransactionService);
  private readonly destroyRef = inject(DestroyRef);

  events: TransactionEvent[] = [];
  isLoading = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactionId'] && this.transactionId && this.visible) {
      this.loadEvents();
    }
  }

  loadEvents(): void {
    if (!this.transactionId) return;
    this.isLoading = true;
    this.transactionService.getTransactionEvents(this.transactionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.events = data;
          this.isLoading = false;
        },
        error: () => {
          this.events = [];
          this.isLoading = false;
        }
      });
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  getEventTypeClass(type: string): string {
    if (type.includes('Created')) return 'created';
    if (type.includes('Updated')) return 'updated';
    if (type.includes('Deleted')) return 'deleted';
    return 'updated';
  }

  getEventTypeIcon(type: string): string {
    if (type.includes('Created')) return 'pi-plus-circle';
    if (type.includes('Updated')) return 'pi-pencil';
    if (type.includes('Deleted')) return 'pi-trash';
    return 'pi-info-circle';
  }

  formatJson(jsonStr: string): string {
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch {
      return jsonStr;
    }
  }
}
