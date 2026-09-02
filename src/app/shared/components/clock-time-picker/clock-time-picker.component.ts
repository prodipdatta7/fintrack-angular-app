import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

export interface TimePreset {
    label: string;
    icon: string;
    hour: number;
    minute: number;
    period: 'AM' | 'PM';
}

@Component({
    selector: 'app-clock-time-picker',
    standalone: true,
    templateUrl: './clock-time-picker.component.html',
    styleUrl: './clock-time-picker.component.scss',
})
export class ClockTimePickerComponent implements OnInit, OnChanges {
    @Input() value = '';
    @Output() selected = new EventEmitter<string>();
    @Output() closed = new EventEmitter<void>();

    hour = 12;
    minute = 0;
    period: 'AM' | 'PM' = 'AM';

    readonly hours: number[] = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    readonly standardMinutes: number[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    readonly presets: TimePreset[] = [
        { label: 'Morning', icon: 'wb_sunny', hour: 9, minute: 0, period: 'AM' },
        { label: 'Noon', icon: 'light_mode', hour: 12, minute: 0, period: 'PM' },
        { label: 'Afternoon', icon: 'wb_twilight', hour: 3, minute: 0, period: 'PM' },
        { label: 'Evening', icon: 'bedtime', hour: 6, minute: 0, period: 'PM' },
        { label: 'Night', icon: 'nights_stay', hour: 9, minute: 0, period: 'PM' },
    ];

    ngOnInit(): void {
        this.parseValue(this.value);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['value'] && !changes['value'].firstChange) {
            this.parseValue(this.value);
        }
    }

    private parseValue(val: string): void {
        if (!val) {
            this.setNow();
            return;
        }
        const [h, m] = val.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) {
            this.setNow();
            return;
        }
        this.minute = Math.max(0, Math.min(59, m));
        const hour24 = h;
        this.period = hour24 >= 12 ? 'PM' : 'AM';
        const hour12 = hour24 % 12;
        this.hour = hour12 === 0 ? 12 : hour12;
    }

    get hourLabel(): string {
        return this.hour.toString().padStart(2, '0');
    }

    get minuteLabel(): string {
        return this.minute.toString().padStart(2, '0');
    }

    get minuteOptions(): number[] {
        if (this.standardMinutes.includes(this.minute)) {
            return this.standardMinutes;
        }
        return [...this.standardMinutes, this.minute].sort((a, b) => a - b);
    }

    setHour(h: number): void {
        this.hour = h;
    }

    setMinute(m: number): void {
        this.minute = m;
    }

    setPeriod(p: 'AM' | 'PM'): void {
        this.period = p;
    }

    incrementHour(): void {
        const idx = this.hours.indexOf(this.hour);
        const nextIdx = (idx + 1) % this.hours.length;
        this.hour = this.hours[nextIdx];
    }

    decrementHour(): void {
        const idx = this.hours.indexOf(this.hour);
        const prevIdx = (idx - 1 + this.hours.length) % this.hours.length;
        this.hour = this.hours[prevIdx];
    }

    incrementMinute(): void {
        this.minute = (this.minute + 1) % 60;
    }

    decrementMinute(): void {
        this.minute = (this.minute - 1 + 60) % 60;
    }

    setNow(): void {
        const now = new Date();
        const rawHours = now.getHours();
        const rawMinutes = now.getMinutes();

        this.minute = rawMinutes;
        this.period = rawHours >= 12 ? 'PM' : 'AM';
        const hour12 = rawHours % 12;
        this.hour = hour12 === 0 ? 12 : hour12;
    }

    applyPreset(preset: TimePreset): void {
        this.hour = preset.hour;
        this.minute = preset.minute;
        this.period = preset.period;
    }

    isPresetActive(preset: TimePreset): boolean {
        return this.hour === preset.hour && this.minute === preset.minute && this.period === preset.period;
    }

    confirm(): void {
        const hour24 =
            this.period === 'PM' ? (this.hour === 12 ? 12 : this.hour + 12) : this.hour === 12 ? 0 : this.hour;
        const result = `${hour24.toString().padStart(2, '0')}:${this.minute.toString().padStart(2, '0')}`;
        this.selected.emit(result);
        this.close();
    }

    close(): void {
        this.closed.emit();
    }
}
