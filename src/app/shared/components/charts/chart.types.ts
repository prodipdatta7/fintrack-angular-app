export interface DonutSlice {
    id: string;
    name: string;
    value: number;
    percent: number;
    color: string;
    icon?: string;
    isOverBudget?: boolean;
    path?: string;
}

export interface FlowStream {
    id: string;
    name: string;
    percent: number;
    color: string;
    value?: number;
    icon?: string;
    path?: string;
    strokeWidth?: number;
    yDest?: number;
}

export interface GaugeGradientStop {
    offset: string;
    color: string;
}

export interface ChartSeries {
    key: string;
    label: string;
    color: string;
    gradientStart?: string;
    gradientEnd?: string;
    lineStrokeWidth?: number;
    areaOpacity?: number;
}

export interface ChartPointData {
    label: string;
    values: Record<string, number>;
    showAxisLabel?: boolean;
    rawDate?: string;
}
