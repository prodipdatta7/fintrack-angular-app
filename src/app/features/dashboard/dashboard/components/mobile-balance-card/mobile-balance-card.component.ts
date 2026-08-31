import { Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Timeframe } from '../../../../../core/models/dashboard.model';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { CustomDateRange } from '../../../../../shared/components/timeframe-selector/timeframe-selector.component';
import { DatePickerComponent } from '../../../../../shared/components/date-picker/date-picker.component';
import { formatTimeframeLabel } from '../../../../../shared/utils/date-range';

const DEFAULT_TIMEFRAMES: Timeframe[] = ['7D', '15D', '30D', 'This Month', '6M', 'This Year', 'Custom'];

@Component({
    selector: 'app-mobile-balance-card',
    standalone: true,
    imports: [CommonModule, FormsModule, AppCurrencyPipe, DatePickerComponent],
    templateUrl: './mobile-balance-card.component.html',
    styleUrl: './mobile-balance-card.component.scss',
})
export class MobileBalanceCardComponent {
    private readonly elementRef = inject(ElementRef);

    readonly totalBalance = input.required<number>();
    readonly totalExpense = input.required<number>();
    readonly activeTimeframe = input<Timeframe>('This Month');
    readonly timeframes = input<Timeframe[]>(DEFAULT_TIMEFRAMES);
    readonly isLoading = input<boolean>(false);

    readonly timeframeChange = output<Timeframe>();
    readonly customRangeChange = output<CustomDateRange>();

    readonly isTimeframeMenuOpen = signal<boolean>(false);
    readonly customStart = signal<string>('');
    readonly customEnd = signal<string>('');

    readonly activeLabel = computed(() => formatTimeframeLabel(this.activeTimeframe()));

    toggleTimeframeMenu(): void {
        this.isTimeframeMenuOpen.update((open) => !open);
    }

    closeTimeframeMenu(): void {
        this.isTimeframeMenuOpen.set(false);
    }

    selectTimeframe(timeframe: Timeframe): void {
        if (timeframe === 'Custom') {
            this.timeframeChange.emit('Custom');
            // Keep menu open for date pickers
            return;
        }

        this.timeframeChange.emit(timeframe);
        this.isTimeframeMenuOpen.set(false);
    }

    onCustomStartChange(date: string): void {
        this.customStart.set(date);
        this.emitCustomRangeIfReady();
    }

    onCustomEndChange(date: string): void {
        this.customEnd.set(date);
        this.emitCustomRangeIfReady();
    }

    applyCustomRange(): void {
        this.emitCustomRangeIfReady();
        if (this.customStart() && this.customEnd()) {
            this.isTimeframeMenuOpen.set(false);
        }
    }

    private emitCustomRangeIfReady(): void {
        const start = this.customStart();
        const end = this.customEnd();
        if (start && end) {
            this.customRangeChange.emit({ from: start, to: end });
        }
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.isTimeframeMenuOpen()) return;
        const target = event.target as HTMLElement;
        if (!this.elementRef.nativeElement.contains(target)) {
            this.closeTimeframeMenu();
        }
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        this.closeTimeframeMenu();
    }
}
