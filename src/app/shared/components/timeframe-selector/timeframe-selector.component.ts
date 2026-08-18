import { Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Timeframe } from '../../../core/models/dashboard.model';
import { formatTimeframeLabel } from '../../utils/date-range';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePickerComponent } from '../date-picker/date-picker.component';

export interface CustomDateRange {
    from: string;
    to: string;
}

const DEFAULT_TIMEFRAMES: Timeframe[] = ['7D', '15D', '30D', 'This Month', '6M', 'This Year'];

@Component({
    selector: 'app-timeframe-selector',
    standalone: true,
    imports: [FormsModule, MatTooltipModule, DatePickerComponent],
    templateUrl: './timeframe-selector.component.html',
    styleUrl: './timeframe-selector.component.scss',
})
export class TimeframeSelectorComponent {
    readonly timeframes = input<Timeframe[]>(DEFAULT_TIMEFRAMES);
    readonly activeTimeframe = input<Timeframe>('This Month');
    readonly startDate = input<string>('');
    readonly endDate = input<string>('');
    readonly variant = input<'pills' | 'segmented' | 'compact' | 'dropdown'>('pills');
    readonly size = input<'sm' | 'md'>('md');
    readonly ariaLabel = input('Select time period');
    readonly showCustomRange = input(false);

    readonly timeframeChange = output<Timeframe>();
    readonly customRangeChange = output<CustomDateRange>();

    customStart = '';
    customEnd = '';

    constructor() {
        effect(() => {
            this.customStart = this.startDate();
            this.customEnd = this.endDate();
        });
    }

    getLabel(timeframe: Timeframe): string {
        return formatTimeframeLabel(timeframe);
    }

    getTooltip(timeframe: Timeframe): string {
        switch (timeframe) {
            case '7D':
                return 'Last 7 Days';
            case '15D':
                return 'Last 15 Days';
            case '30D':
                return 'Last 30 Days';
            case 'This Month':
                return 'Current Month';
            case '6M':
                return 'Last 6 Months';
            case 'This Year':
                return 'Current Year';
            case 'Custom':
                return 'Custom Date Range';
            case 'All':
                return 'All Time';
            default:
                return formatTimeframeLabel(timeframe);
        }
    }

    selectTimeframe(frame: Timeframe): void {
        if (frame === this.activeTimeframe()) return;
        this.timeframeChange.emit(frame);
    }

    onDropdownChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const selected = target.value as Timeframe;
        if (selected && selected !== this.activeTimeframe()) {
            this.timeframeChange.emit(selected);
        }
    }

    onCustomStartChange(date: string): void {
        this.customStart = date;
        this.emitCustomRange();
    }

    onCustomEndChange(date: string): void {
        this.customEnd = date;
        this.emitCustomRange();
    }

    emitCustomRange(): void {
        if (!this.customStart || !this.customEnd) return;
        this.customRangeChange.emit({ from: this.customStart, to: this.customEnd });
    }
}
