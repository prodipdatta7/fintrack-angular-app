import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssistantService } from '../../../../core/services/assistant.service';
import { AssistantChatComponent } from '../assistant-chat/assistant-chat.component';
import { AssistantInputBarComponent } from '../assistant-input-bar/assistant-input-bar.component';
import { AssistantHistoryDrawerComponent } from '../assistant-history-drawer/assistant-history-drawer.component';
import { AssistantPermissionModalComponent } from '../assistant-permission-modal/assistant-permission-modal.component';

@Component({
    selector: 'app-assistant-drawer',
    standalone: true,
    imports: [
        CommonModule,
        AssistantChatComponent,
        AssistantInputBarComponent,
        AssistantHistoryDrawerComponent,
        AssistantPermissionModalComponent,
    ],
    templateUrl: './assistant-drawer.component.html',
    styleUrl: './assistant-drawer.component.scss',
})
export class AssistantDrawerComponent {
    readonly assistantService = inject(AssistantService);

    toggle(): void {
        this.assistantService.toggleOpen();
    }

    close(): void {
        this.assistantService.toggleOpen(false);
    }

    newChat(): void {
        this.assistantService.startNewConversation();
    }

    toggleHistory(): void {
        this.assistantService.toggleHistory();
    }

    @HostListener('document:keydown.escape')
    handleEscapeKey(): void {
        if (!this.assistantService.isOpen()) return;

        if (this.assistantService.isHistoryOpen()) {
            this.assistantService.toggleHistory(false);
        } else {
            this.close();
        }
    }
}
