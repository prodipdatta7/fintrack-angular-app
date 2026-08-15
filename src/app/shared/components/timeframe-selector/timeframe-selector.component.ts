import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Timeframe } from '../../../core/models/dashboard.model';
import { formatTimeframeLabel } from '../../utils/date-range';

export interface CustomDateRange {
    from: string;
    to: string;
}

const DEFAULT_TIMEFRAMES: Timeframe[] = ['7D', '15D', '30D', 'This Month', '6M', 'This Year'];

@Component({
    selector: 'app-timeframe-selector',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './timeframe-selector.component.html',
    styleUrl: './timeframe-selector.component.scss',
})
export class TimeframeSelectorComponent {
    readonly timeframes = input<Timeframe[]>(DEFAULT_TIMEFRAMES);
    readonly activeTimeframe = input<Timeframe>('This Month');
    readonly variant = input<'pills' | 'segmented' | 'compact' | 'dropdown'>('pills');
    readonly size = input<'sm' | 'md'>('md');
    readonly ariaLabel = input('Select time period');
    readonly showCustomRange = input(false);

    readonly timeframeChange = output<Timeframe>();
    readonly customRangeChange = output<CustomDateRange>();

    customStart = '';
    customEnd = '';

    getLabel(timeframe: Timeframe): string {
        return formatTimeframeLabel(timeframe);
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

    emitCustomRange(): void {
        if (!this.customStart || !this.customEnd) return;
        this.customRangeChange.emit({ from: this.customStart, to: this.customEnd });
    }
}
