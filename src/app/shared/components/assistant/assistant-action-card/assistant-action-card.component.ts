import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssistantMessage } from '../../../../core/models/assistant.model';

@Component({
    selector: 'app-assistant-action-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './assistant-action-card.component.html',
    styleUrl: './assistant-action-card.component.scss',
})
export class AssistantActionCardComponent {
    @Input({ required: true }) message!: AssistantMessage;
    @Output() confirm = new EventEmitter<AssistantMessage>();
    @Output() cancel = new EventEmitter<AssistantMessage>();

    readonly parsedPayload = computed(() => {
        if (!this.message.actionPayloadJson) return null;
        try {
            return JSON.parse(this.message.actionPayloadJson);
        } catch {
            return null;
        }
    });

    getActionIcon(): string {
        switch (this.message.actionType) {
            case 'AddTransaction': return 'add_circle';
            case 'TransferFunds': return 'swap_horiz';
            case 'AddAccount': return 'account_balance_wallet';
            case 'AddCategory': case 'AddTag': return 'label';
            case 'CreateSavingsPlan': return 'savings';
            default: return 'task_alt';
        }
    }

    onConfirm(): void {
        this.confirm.emit(this.message);
    }

    onCancel(): void {
        this.cancel.emit(this.message);
    }
}
