import { Component, input } from '@angular/core';

export type StatCardVariant = 'success' | 'primary' | 'danger';

@Component({
    selector: 'app-stat-card',
    standalone: true,
    imports: [],
    templateUrl: './stat-card.component.html',
    styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
    readonly title = input.required<string>();
    readonly amount = input.required<string>();
    readonly subtitle = input('');
    readonly icon = input('');
    readonly variant = input<StatCardVariant>('primary');
}
