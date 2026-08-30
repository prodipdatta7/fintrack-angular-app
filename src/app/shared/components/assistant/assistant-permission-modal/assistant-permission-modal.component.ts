import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssistantService } from '../../../../core/services/assistant.service';

@Component({
    selector: 'app-assistant-permission-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './assistant-permission-modal.component.html',
    styleUrl: './assistant-permission-modal.component.scss',
})
export class AssistantPermissionModalComponent {
    readonly assistantService = inject(AssistantService);

    get permissionType(): 'microphone' | 'camera' {
        return this.assistantService.pendingPermissionType() ?? 'microphone';
    }

    grant(): void {
        this.assistantService.resolvePermission(true);
    }

    deny(): void {
        this.assistantService.resolvePermission(false);
    }
}
