import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { evaluatePassword, PasswordEvaluation } from '../../../core/validators/password-policy.validator';

@Component({
    selector: 'app-password-requirements',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './password-requirements.component.html',
    styleUrl: './password-requirements.component.scss',
})
export class PasswordRequirementsComponent {
    private _password = signal<string>('');

    @Input()
    set password(val: string | null | undefined) {
        this._password.set(val || '');
    }
    get password(): string {
        return this._password();
    }

    @Input() showWhenEmpty = false;

    evaluation = computed<PasswordEvaluation>(() => {
        return evaluatePassword(this._password());
    });
}
