import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantService } from '../../../../core/services/assistant.service';
import { AssistantConversation } from '../../../../core/models/assistant.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
    selector: 'app-assistant-history-drawer',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './assistant-history-drawer.component.html',
    styleUrl: './assistant-history-drawer.component.scss',
})
export class AssistantHistoryDrawerComponent {
    readonly assistantService = inject(AssistantService);
    private readonly toast = inject(ToastService);

    searchTerm = signal<string>('');
    editingConversationId = signal<string | null>(null);
    editTitleInput = signal<string>('');
    deletingConversationId = signal<string | null>(null);

    readonly pinnedConversations = computed(() =>
        this.assistantService.conversations().filter((c) => c.isPinned),
    );

    readonly recentConversations = computed(() =>
        this.assistantService.conversations().filter((c) => !c.isPinned),
    );

    onSearchChange(term: string): void {
        this.searchTerm.set(term);
        this.assistantService.getConversations(term).subscribe();
    }

    clearSearch(): void {
        this.searchTerm.set('');
        this.assistantService.getConversations().subscribe();
    }

    selectConversation(conversation: AssistantConversation): void {
        this.assistantService.selectConversation(conversation.id);
    }

    startNewChat(): void {
        this.assistantService.startNewConversation();
    }

    closeHistory(): void {
        this.assistantService.toggleHistory(false);
    }

    togglePin(conversation: AssistantConversation, event: Event): void {
        event.stopPropagation();
        this.assistantService.togglePinConversation(conversation.id).subscribe({
            next: (isPinned) => {
                this.toast.show(
                    isPinned ? 'Conversation pinned to top.' : 'Conversation unpinned.',
                    'info',
                );
            },
            error: () => this.toast.error('Failed to update pin status.'),
        });
    }

    startRename(conversation: AssistantConversation, event: Event): void {
        event.stopPropagation();
        this.editingConversationId.set(conversation.id);
        this.editTitleInput.set(conversation.title);
    }

    saveRename(conversation: AssistantConversation, event: Event): void {
        event.stopPropagation();
        const newTitle = this.editTitleInput().trim();
        if (!newTitle || newTitle === conversation.title) {
            this.editingConversationId.set(null);
            return;
        }

        this.assistantService.updateConversationTitle(conversation.id, newTitle).subscribe({
            next: () => {
                this.editingConversationId.set(null);
                this.toast.show('Conversation renamed successfully.', 'success');
            },
            error: () => this.toast.error('Failed to rename conversation.'),
        });
    }

    cancelRename(event: Event): void {
        event.stopPropagation();
        this.editingConversationId.set(null);
    }

    confirmDelete(conversation: AssistantConversation, event: Event): void {
        event.stopPropagation();
        this.deletingConversationId.set(conversation.id);
    }

    cancelDelete(event: Event): void {
        event.stopPropagation();
        this.deletingConversationId.set(null);
    }

    executeDelete(conversation: AssistantConversation, event: Event): void {
        event.stopPropagation();
        this.assistantService.deleteConversation(conversation.id).subscribe({
            next: () => {
                this.deletingConversationId.set(null);
                this.toast.show('Conversation deleted.', 'info');
            },
            error: () => this.toast.error('Failed to delete conversation.'),
        });
    }
}
