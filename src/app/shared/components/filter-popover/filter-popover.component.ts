import { Component, input, model, output } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { A11yModule } from '@angular/cdk/a11y';

/**
 * Trigger + CDK overlay panel. The panel body is projected, so each feature
 * supplies its own filter controls.
 */
@Component({
    selector: 'app-filter-popover',
    standalone: true,
    imports: [OverlayModule, A11yModule],
    templateUrl: './filter-popover.component.html',
    styleUrl: './filter-popover.component.scss',
})
export class FilterPopoverComponent {
    readonly label = input('Advance Filter');
    readonly panelTitle = input('Advanced Filter Rules');
    readonly activeCount = input(0);
    readonly applyLabel = input('Apply & Close');

    readonly open = model(false);
    readonly reset = output<void>();

    toggle(): void {
        this.open.update((value) => !value);
    }

    close(): void {
        this.open.set(false);
    }

    onReset(): void {
        this.reset.emit();
    }
}
