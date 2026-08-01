import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-clock-time-picker',
  standalone: true,
  templateUrl: './clock-time-picker.component.html',
  styleUrl: './clock-time-picker.component.scss'
})
export class ClockTimePickerComponent {
  @Input() value = '';
  @Output() selected = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  mode: 'hour' | 'minute' = 'hour';
  period: 'AM' | 'PM' = 'AM';
  hour = 12;
  minute = 0;

  ngOnInit(): void {
    if (!this.value) return;
    const [h, m] = this.value.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return;
    this.minute = m;
    const hour24 = h;
    this.period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12;
    this.hour = hour12 === 0 ? 12 : hour12;
  }

  get minuteLabel(): string {
    return this.minute.toString().padStart(2, '0');
  }

  get markers(): Array<{ label: string; value: number; selected: boolean; isTick: boolean; style: string }> {
    if (this.mode === 'hour') {
      return this.hourMarkers;
    }
    return this.minuteMarkers;
  }

  private get hourMarkers(): Array<{ label: string; value: number; selected: boolean; isTick: boolean; style: string }> {
    const values = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    return values.map((v, i) => ({
      label: v.toString(),
      value: v,
      selected: v === this.hour,
      isTick: false,
      style: this.markerStyle(i, 12, 104)
    }));
  }

  private get minuteMarkers(): Array<{ label: string; value: number; selected: boolean; isTick: boolean; style: string }> {
    return Array.from({ length: 60 }, (_, i) => ({
      label: i % 5 === 0 ? i.toString().padStart(2, '0') : '',
      value: i,
      selected: this.minute === i,
      isTick: i % 5 !== 0,
      style: this.markerStyle(i, 60, 116)
    }));
  }

  private markerStyle(index: number, count: number, radius: number): string {
    const angle = (360 / count) * index;
    return `rotate(${angle}deg) translateY(${-radius}px) rotate(${-angle}deg)`;
  }

  get handStyle(): string {
    const total = this.mode === 'hour' ? 12 : 60;
    const value = this.mode === 'hour' ? this.hour % 12 : this.minute;
    const angle = (360 / total) * value;
    return `rotate(${angle}deg)`;
  }

  switchMode(mode: 'hour' | 'minute'): void {
    this.mode = mode;
  }

  setPeriod(period: 'AM' | 'PM'): void {
    this.period = period;
  }

  selectValue(value: number): void {
    if (this.mode === 'hour') {
      this.hour = value;
      this.mode = 'minute';
    } else {
      this.minute = value;
    }
  }

  dragging = false;
  private dragStartedInHourMode = false;

  onDialDown(event: PointerEvent, dial: HTMLElement): void {
    event.preventDefault();
    this.dragging = true;
    this.dragStartedInHourMode = this.mode === 'hour';
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    this.applyPointerValue(event, dial);
  }

  onDialMove(event: PointerEvent, dial: HTMLElement): void {
    if (!this.dragging) return;
    this.applyPointerValue(event, dial);
  }

  onDialUp(): void {
    if (this.dragging && this.dragStartedInHourMode) {
      this.mode = 'minute';
    }
    this.dragging = false;
  }

  private applyPointerValue(event: PointerEvent, dial: HTMLElement): void {
    const rect = dial.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const angle = Math.atan2(event.clientY - cy, event.clientX - cx);
    let deg = (angle * 180) / Math.PI;
    if (deg < 0) deg += 360;
    deg = (deg + 90) % 360;

    if (this.mode === 'hour') {
      const step = 360 / 12;
      let index = Math.round(deg / step) % 12;
      let hour = index === 0 ? 12 : index;
      this.hour = hour;
    } else {
      const step = 360 / 60;
      this.minute = Math.round(deg / step) % 60;
    }
  }

  confirm(): void {
    const hour24 = this.period === 'PM'
      ? (this.hour === 12 ? 12 : this.hour + 12)
      : (this.hour === 12 ? 0 : this.hour);
    const result = `${hour24.toString().padStart(2, '0')}:${this.minute.toString().padStart(2, '0')}`;
    this.selected.emit(result);
    this.close();
  }

  close(): void {
    this.closed.emit();
  }
}
