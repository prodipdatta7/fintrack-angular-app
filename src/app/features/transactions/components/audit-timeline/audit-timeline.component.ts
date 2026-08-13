import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TransactionEvent } from '../../../../core/models/transaction-event.model';

/**
 * Event-sourcing timeline. Shared by the transaction detail page and the
 * list-row audit drawer so both surfaces read identically.
 */
@Component({
    selector: 'app-audit-timeline',
    standalone: true,
    imports: [DatePipe],
    templateUrl: './audit-timeline.component.html',
    styleUrl: './audit-timeline.component.scss',
})
export class AuditTimelineComponent {
    readonly events = input.required<TransactionEvent[]>();
    readonly isLoading = input(false);

    nodeClass(eventType: string): string {
        if (eventType.includes('Created')) return 'created';
        if (eventType.includes('Deleted')) return 'deleted';
        return 'updated';
    }

    icon(eventType: string): string {
        if (eventType.includes('Created')) return 'add_circle';
        if (eventType.includes('Deleted')) return 'delete';
        return 'edit';
    }

    /** Older records predate operator capture — never render an empty label. */
    operator(event: TransactionEvent): string {
        return event.performedBy || 'System';
    }

    describe(event: TransactionEvent): string {
        return event.detail || event.summary || event.eventType;
    }
}
