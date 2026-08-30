import { Component, ElementRef, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssistantService } from '../../../../core/services/assistant.service';
import { AssistantMessage } from '../../../../core/models/assistant.model';
import { AssistantActionCardComponent } from '../assistant-action-card/assistant-action-card.component';

@Component({
    selector: 'app-assistant-chat',
    standalone: true,
    imports: [CommonModule, AssistantActionCardComponent],
    templateUrl: './assistant-chat.component.html',
    styleUrl: './assistant-chat.component.scss',
})
export class AssistantChatComponent {
    readonly assistantService = inject(AssistantService);

    @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLDivElement>;

    readonly suggestions = [
        "What's my total balance?",
        'Show top expenses this month',
        'Check my savings goals',
        'Add ৳350 for lunch today',
    ];

    constructor() {
        effect(() => {
            // Trigger scroll whenever messages change or processing starts/stops
            const msgs = this.assistantService.messages();
            const processing = this.assistantService.isProcessing();
            if (msgs.length || processing) {
                setTimeout(() => this.scrollToBottom(), 50);
            }
        });
    }

    sendSuggestion(prompt: string): void {
        this.assistantService.sendMessage(prompt);
    }

    onConfirmAction(msg: AssistantMessage): void {
        this.assistantService.confirmProposedAction(msg);
    }

    onCancelAction(msg: AssistantMessage): void {
        this.assistantService.cancelProposedAction(msg);
    }

    speakMessage(content: string, event: Event): void {
        event.stopPropagation();
        this.assistantService.speakText(content);
    }

    private scrollToBottom(): void {
        if (this.scrollContainer?.nativeElement) {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        }
    }
}
