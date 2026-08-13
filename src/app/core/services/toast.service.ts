import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

const DISMISS_AFTER_MS = 3000;

@Injectable({
    providedIn: 'root',
})
export class ToastService {
    toasts = signal<Toast[]>([]);

    /** Monotonic counter — Date.now() would collide for toasts raised in the same tick. */
    private nextId = 0;
    private timers = new Map<number, ReturnType<typeof setTimeout>>();

    show(message: string, type: ToastType = 'success'): void {
        const id = ++this.nextId;
        this.toasts.update((list) => [...list, { id, message, type }]);
        this.timers.set(
            id,
            setTimeout(() => this.dismiss(id), DISMISS_AFTER_MS),
        );
    }

    error(message: string): void {
        this.show(message, 'error');
    }

    dismiss(id: number): void {
        const timer = this.timers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(id);
        }
        this.toasts.update((list) => list.filter((toast) => toast.id !== id));
    }

    clear(): void {
        this.timers.forEach((timer) => clearTimeout(timer));
        this.timers.clear();
        this.toasts.set([]);
    }
}
