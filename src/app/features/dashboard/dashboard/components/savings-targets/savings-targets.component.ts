import { Component, computed, input } from '@angular/core';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { RouterLink } from '@angular/router';
import { SavingsPlan } from '../../../../../core/models/plan.model';

@Component({
    selector: 'app-savings-targets',
    standalone: true,
    imports: [AppCurrencyPipe, RouterLink],
    templateUrl: './savings-targets.component.html',
    styleUrl: './savings-targets.component.scss',
})
export class SavingsTargetsComponent {
    readonly plans = input.required<SavingsPlan[]>();
    readonly isLoading = input(false);

    readonly rows = computed(() =>
        this.plans().map((plan) => ({
            plan,
            percent:
                plan.targetAmount > 0 ? Math.min(Math.round((plan.currentAmount / plan.targetAmount) * 100), 100) : 0,
        })),
    );
}
