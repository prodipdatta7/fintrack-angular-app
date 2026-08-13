import { Component, inject } from '@angular/core';
import { Toast, ToastService, ToastType } from '../../../core/services/toast.service';

@Component({
    selector: 'app-toast-host',
    standalone: true,
    imports: [],
    templateUrl: './toast-host.component.html',
    styleUrl: './toast-host.component.scss',
})
export class ToastHostComponent {
    private readonly toastService = inject(ToastService);

    readonly toasts = this.toastService.toasts;

    dismiss(toast: Toast): void {
        this.toastService.dismiss(toast.id);
    }

    icon(type: ToastType): string {
        if (type === 'error') return 'error_outline';
        if (type === 'info') return 'info';
        return 'check_circle';
    }
}
