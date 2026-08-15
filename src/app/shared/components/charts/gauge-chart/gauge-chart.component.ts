import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GaugeGradientStop } from '../chart.types';

let instanceCounter = 0;

@Component({
    selector: 'app-gauge-chart',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './gauge-chart.component.html',
    styleUrl: './gauge-chart.component.scss',
})
export class GaugeChartComponent {
    readonly value = input.required<number>();
    readonly maxValue = input<number>(100);
    readonly title = input<string>('');
    readonly subtitle = input<string>('Burn Velocity Index');
    readonly arcThickness = input<number>(8);
    readonly gradientStops = input<GaugeGradientStop[]>([
        { offset: '0%', color: '#00F2FE' },
        { offset: '60%', color: '#a855f7' },
        { offset: '100%', color: '#ff007f' },
    ]);

    readonly gaugeClick = output<number>();

    readonly uid = `gauge-${++instanceCounter}`;

    readonly percent = computed(() => {
        const val = this.value();
        const max = this.maxValue();
        if (max <= 0) return 0;
        return Math.min(100, Math.max(0, Math.round((val / max) * 100)));
    });

    readonly gaugeArcDash = computed(() => {
        // Semi-circle perimeter for r=40 is ~125.6
        const maxArc = 125.6;
        const filled = (this.percent() / 100) * maxArc;
        return `${filled.toFixed(1)} 251.2`;
    });

    onGaugeClick(): void {
        this.gaugeClick.emit(this.percent());
    }
}
