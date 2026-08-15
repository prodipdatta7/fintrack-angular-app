import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowStream } from '../chart.types';

interface ComputedFlowStream extends FlowStream {
    shortName: string;
    path: string;
    strokeWidth: number;
    yDest: number;
}

@Component({
    selector: 'app-flow-chart',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './flow-chart.component.html',
    styleUrl: './flow-chart.component.scss',
})
export class FlowChartComponent {
    readonly streams = input.required<FlowStream[]>();
    readonly sourceLabel = input<string>('TOTAL SPEND');
    readonly sourceSub = input<string>('BURN ORIGIN');
    readonly viewBoxWidth = input<number>(500);
    readonly viewBoxHeight = input<number>(280);
    readonly animated = input<boolean>(true);
    readonly activeId = input<string | null>(null);

    readonly streamHover = output<string | null>();
    readonly streamSelect = output<FlowStream>();

    readonly internalHoveredId = signal<string | null>(null);
    readonly effectiveHoveredId = computed(() => this.activeId() ?? this.internalHoveredId());

    readonly viewBox = computed(() => `0 0 ${this.viewBoxWidth()} ${this.viewBoxHeight()}`);

    readonly computedStreams = computed<ComputedFlowStream[]>(() => {
        const list = this.streams().filter((s) => s.percent > 0).slice(0, 6);
        if (!list.length) return [];

        const totalH = this.viewBoxHeight() - 50;
        const count = list.length;
        const step = count > 1 ? totalH / (count - 1) : 0;
        const yStart = this.viewBoxHeight() / 2; // 140

        return list.map((stream, idx) => {
            const yDest = count === 1 ? yStart : 25 + idx * step;
            const strokeWidth = Math.max(2.5, Math.min(9, Math.round((stream.percent / 100) * 12)));
            const path = `M 130 ${yStart} C 200 ${yStart}, 210 ${yDest}, 285 ${yDest}`;

            const shortName =
                stream.name.length > 15 ? `${stream.name.slice(0, 14)}…` : stream.name;

            return {
                ...stream,
                shortName,
                path,
                strokeWidth,
                yDest,
            };
        });
    });

    readonly sourceShortLabel = computed(() => {
        const label = this.sourceLabel();
        return label.length > 14 ? `${label.slice(0, 13)}…` : label;
    });

    onStreamEnter(id: string): void {
        this.internalHoveredId.set(id);
        this.streamHover.emit(id);
    }

    onStreamLeave(): void {
        this.internalHoveredId.set(null);
        this.streamHover.emit(null);
    }

    onStreamClick(stream: FlowStream): void {
        this.streamSelect.emit(stream);
    }
}
