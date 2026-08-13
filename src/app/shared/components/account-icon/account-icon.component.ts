import { Component, Input, OnChanges, computed, signal } from '@angular/core';
import {
    findProvider,
    isLogoPath,
    officialLogoUrl,
    type AccountProviderDef,
} from '../../../core/data/account-providers';

/**
 * Renders an account/provider mark: official Clearbit logo when available,
 * bundled SVG fallback, then emoji / Material icon.
 */
@Component({
    selector: 'app-account-icon',
    standalone: true,
    template: `
        @if (imageSrc()) {
            <img
                class="account-logo"
                [src]="imageSrc()!"
                [alt]="altLabel()"
                (error)="onImageError()"
                loading="lazy"
                decoding="async"
            />
        } @else if (emojiGlyph()) {
            <span class="account-emoji" aria-hidden="true">{{ emojiGlyph() }}</span>
        } @else {
            <span class="material-icons account-fallback" aria-hidden="true">{{ materialIcon() }}</span>
        }
    `,
    styles: [
        `
            :host {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                overflow: hidden;
                border-radius: inherit;
            }
            .account-logo {
                width: 72%;
                height: 72%;
                object-fit: contain;
            }
            .account-emoji {
                font-size: 1.25rem;
                line-height: 1;
            }
            .account-fallback {
                font-size: 1.25rem;
                color: var(--text-muted);
            }
        `,
    ],
})
export class AccountIconComponent implements OnChanges {
    @Input() icon = '';
    @Input() provider = '';
    @Input() name = '';
    @Input() accountType = '';

    private readonly matched = signal<AccountProviderDef | undefined>(undefined);
    private readonly stage = signal(0);

    readonly imageSrc = computed(() => {
        const provider = this.matched();
        const icon = this.icon?.trim() ?? '';
        const order: string[] = [];

        if (provider) {
            const live = officialLogoUrl(provider.domain);
            if (live) order.push(live);
            order.push(provider.logo);
        }

        if (isLogoPath(icon) && !order.includes(icon)) {
            order.push(icon);
        }

        return order[this.stage()] ?? null;
    });

    readonly emojiGlyph = computed(() => {
        const icon = this.icon?.trim() ?? '';
        if (!icon || isLogoPath(icon)) return '';
        return icon;
    });

    readonly altLabel = computed(() => this.matched()?.name || this.provider || this.name || 'Account');

    readonly materialIcon = computed(() => {
        switch (this.accountType) {
            case 'MFS':
                return 'phone_iphone';
            case 'Cash':
                return 'payments';
            case 'Credit':
                return 'credit_card';
            default:
                return 'account_balance';
        }
    });

    ngOnChanges(): void {
        this.matched.set(findProvider({ icon: this.icon, provider: this.provider, name: this.name }));
        this.stage.set(0);
    }

    onImageError(): void {
        this.stage.update((value) => value + 1);
    }
}
