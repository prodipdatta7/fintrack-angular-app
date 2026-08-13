import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

/**
 * Thin wrapper so callers do not have to repeat the dialog config.
 * Replaces the window.confirm() calls the app used previously.
 */
@Injectable({
    providedIn: 'root',
})
export class ConfirmDialogService {
    private readonly dialog = inject(MatDialog);

    open(data: ConfirmDialogData): Observable<boolean> {
        return this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
                data,
                width: '26rem',
                maxWidth: 'calc(100vw - 2rem)',
                autoFocus: false,
                restoreFocus: true,
            })
            .afterClosed() as Observable<boolean>;
    }

    /** Convenience for the recurring "delete this record?" case. */
    confirmDelete(message: string, title = 'Delete record'): Observable<boolean> {
        return this.open({ title, message, confirmLabel: 'Delete', danger: true });
    }
}
