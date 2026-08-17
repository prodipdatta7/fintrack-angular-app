import {
    Component,
    ViewChild,
    computed,
    input,
    output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    MatDatepicker,
    MatDatepickerInputEvent,
    MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
    selector: 'app-date-picker',
    standalone: true,
    imports: [CommonModule, FormsModule, MatDatepickerModule, MatNativeDateModule],
    templateUrl: './date-picker.component.html',
    styleUrl: './date-picker.component.scss',
})
export class DatePickerComponent {
    @ViewChild('picker') picker!: MatDatepicker<Date>;

    readonly value = input<string>('');
    readonly label = input<string>('');
    readonly placeholder = input<string>('YYYY-MM-DD');
    readonly ariaLabel = input<string>('');
    readonly disabled = input<boolean>(false);

    readonly valueChange = output<string>();

    readonly dateObject = computed<Date | null>(() => {
        const val = this.value();
        if (!val) return null;
        const [year, month, day] = val.split('-').map(Number);
        if (!year || !month || !day) return null;
        return new Date(year, month - 1, day);
    });

    readonly displayValue = computed<string>(() => {
        return this.value() || '';
    });

    openPicker(): void {
        if (!this.disabled() && this.picker) {
            this.picker.open();
        }
    }

    onDateChange(event: MatDatepickerInputEvent<Date>): void {
        const d = event.value;
        if (!d) {
            this.valueChange.emit('');
            return;
        }
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;
        this.valueChange.emit(formatted);
    }

    clearDate(): void {
        if (this.disabled()) return;
        this.valueChange.emit('');
    }
}
