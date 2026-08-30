import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantService } from '../../../../core/services/assistant.service';

@Component({
    selector: 'app-assistant-input-bar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './assistant-input-bar.component.html',
    styleUrl: './assistant-input-bar.component.scss',
})
export class AssistantInputBarComponent {
    readonly assistantService = inject(AssistantService);

    @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

    userInput = signal<string>('');

    onSubmit(): void {
        const text = this.userInput().trim();
        if (!text || this.assistantService.isProcessing()) return;

        this.assistantService.sendMessage(text);
        this.userInput.set('');
    }

    async onAttachClick(): Promise<void> {
        // Request camera/receipt permission first
        const granted = await this.assistantService.promptPermission('camera');
        if (granted) {
            this.fileInput.nativeElement.click();
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            this.assistantService.extractReceipt(file);
            input.value = '';
        }
    }

    async onVoiceToggle(): Promise<void> {
        if (this.assistantService.voiceState() === 'listening') {
            this.assistantService.stopVoiceRecognition();
            return;
        }

        const granted = await this.assistantService.promptPermission('microphone');
        if (granted) {
            await this.assistantService.startVoiceRecognition((text) => {
                this.userInput.set(text);
            });
        }
    }
}
