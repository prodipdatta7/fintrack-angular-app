import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
    let fixture: ComponentFixture<ConfirmDialogComponent>;
    let dialogRef: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent, boolean>>;

    const setup = async (data: ConfirmDialogData) => {
        dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

        await TestBed.configureTestingModule({
            imports: [ConfirmDialogComponent, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: MAT_DIALOG_DATA, useValue: data },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmDialogComponent);
        fixture.detectChanges();
    };

    it('should render the title, message and default labels', async () => {
        await setup({ title: 'Delete record', message: 'This cannot be undone.' });

        const host = fixture.nativeElement as HTMLElement;
        expect(host.querySelector('.confirm-title')?.textContent?.trim()).toBe('Delete record');
        expect(host.querySelector('.confirm-message')?.textContent?.trim()).toBe('This cannot be undone.');

        const buttons = Array.from(host.querySelectorAll('.confirm-actions button')) as HTMLButtonElement[];
        expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Cancel', 'Confirm']);
    });

    it('should close with true on confirm', async () => {
        await setup({ title: 'Delete', message: 'Sure?' });
        (fixture.nativeElement.querySelectorAll('.confirm-actions button')[1] as HTMLButtonElement).click();
        expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should close with false on cancel', async () => {
        await setup({ title: 'Delete', message: 'Sure?' });
        (fixture.nativeElement.querySelectorAll('.confirm-actions button')[0] as HTMLButtonElement).click();
        expect(dialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should use the danger treatment and custom labels when asked', async () => {
        await setup({
            title: 'Delete transaction',
            message: 'A TransactionDeleted event will be recorded.',
            confirmLabel: 'Delete',
            cancelLabel: 'Keep',
            danger: true,
        });

        const host = fixture.nativeElement as HTMLElement;
        expect(host.querySelector('.confirm-icon')?.classList).toContain('confirm-icon--danger');

        const buttons = Array.from(host.querySelectorAll('.confirm-actions button')) as HTMLButtonElement[];
        expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Keep', 'Delete']);
        expect(buttons[1].classList).toContain('btn-danger');
    });
});
