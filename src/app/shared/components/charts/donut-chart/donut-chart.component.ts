import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DonutSlice } from '../chart.types';
import { AppCurrencyPipe } from '../../../pipes/app-currency.pipe';

import {
    PIE_CX,
    PIE_CY,
    PIE_INNER_R,
    PIE_OUTER_R,
    PIE_SIZE,
    buildPieSlices,
} from '../../../utils/pie-geometry';

let instanceCounter = 0;

interface InternalDonutSlice extends DonutSlice {
    path: string;
    midAngle: number;
}

@Component({
    selector: 'app-donut-chart',
    standalone: true,
    imports: [CommonModule, AppCurrencyPipe],
    templateUrl: './donut-chart.component.html',
    styleUrl: './donut-chart.component.scss',
})
export class DonutChartComponent {
    readonly slices = input.required<DonutSlice[]>();
    readonly totalValue = input<number | null>(null);
    readonly holeRadius = input<number>(PIE_INNER_R);
    readonly outerRadius = input<number>(PIE_OUTER_R);
    readonly viewBoxSize = input<number>(PIE_SIZE);
    readonly showHalo = input<boolean>(true);
    readonly showCenterHud = input<boolean>(true);
    readonly showTooltip = input<boolean>(true);
    readonly centerKicker = input<string>('OUTFLOW TOTAL');
    readonly centerSubLabel = input<string>('Active Outflows');
    readonly emptyMessage = input<string>('No spending recorded in this period');

    readonly sliceHover = output<string | null>();
    readonly sliceSelect = output<DonutSlice>();

    readonly uid = `donut-chart-${++instanceCounter}`;
    readonly activeId = input<string | null>(null);
    readonly internalHoveredId = signal<string | null>(null);
    readonly effectiveHoveredId = computed(() => this.activeId() ?? this.internalHoveredId());

    readonly center = computed(() => this.viewBoxSize() / 2);
    readonly viewBox = computed(() => `0 0 ${this.viewBoxSize()} ${this.viewBoxSize()}`);

    readonly calculatedTotal = computed(() => {
        const explicit = this.totalValue();
        if (explicit !== null && explicit !== undefined) return explicit;
        return this.slices().reduce((sum, s) => sum + s.value, 0);
    });

    readonly activeCount = computed(() => this.slices().filter((s) => s.value > 0).length);

    readonly computedSlices = computed<InternalDonutSlice[]>(() => {
        const list = this.slices().filter((s) => s.value > 0);
        const total = this.calculatedTotal();
        if (total <= 0 || !list.length) return [];

        const pieSlices = buildPieSlices(
            list.map((s) => ({ id: s.id, value: s.value, color: s.color })),
            total,
            {
                cx: this.center(),
                cy: this.center(),
                outerR: this.outerRadius(),
                innerR: this.holeRadius(),
            },
        );

        const byId = new Map(list.map((s) => [s.id, s]));

        return pieSlices.map((ps) => {
            const original = byId.get(ps.id);
            return {
                id: ps.id,
                name: original?.name ?? ps.id,
                value: ps.value,
                percent: ps.percent,
                color: ps.color,
                icon: original?.icon,
                isOverBudget: original?.isOverBudget,
                path: ps.path,
                midAngle: ps.midAngle,
            };
        });
    });

    readonly hoveredSlice = computed(() => {
        const id = this.effectiveHoveredId();
        if (!id) return null;
        const match = this.computedSlices().find((s) => s.id === id);
        if (!match) return null;

        const left = Math.round(50 + 36 * Math.cos(match.midAngle));
        const top = Math.round(50 + 36 * Math.sin(match.midAngle));

        return {
            ...match,
            left: Math.max(8, Math.min(84, left)),
            top: Math.max(10, Math.min(78, top)),
        };
    });

    onSliceEnter(id: string): void {
        this.internalHoveredId.set(id);
        this.sliceHover.emit(id);
    }

    onSliceLeave(): void {
        this.internalHoveredId.set(null);
        this.sliceHover.emit(null);
    }

    onSliceClick(slice: DonutSlice): void {
        this.sliceSelect.emit(slice);
    }

    isEmoji(icon?: string): boolean {
        if (!icon) return false;
        return /\p{Extended_Pictographic}/u.test(icon);
    }
}
