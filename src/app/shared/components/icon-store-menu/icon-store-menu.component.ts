import { Component, EventEmitter, Input, Output, ViewChild, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { ICON_STORE_ICONS, isMaterialIconName } from '../../data/icon-store';
import { isLogoPath } from '../../../core/data/account-providers';

@Component({
    selector: 'app-icon-store-menu',
    standalone: true,
    imports: [FormsModule, MatMenuModule, MatIconModule],
    templateUrl: './icon-store-menu.component.html',
    styleUrl: './icon-store-menu.component.scss',
})
export class IconStoreMenuComponent {
    @Input() value = '';
    /** Optional catalog logo path shown as a restore action. */
    @Input() providerLogo: string | null = null;
    @Output() valueChange = new EventEmitter<string>();

    @ViewChild(MatMenuTrigger) private menuTrigger?: MatMenuTrigger;

    readonly icons = ICON_STORE_ICONS;
    readonly search = signal('');

    readonly filteredIcons = computed(() => {
        const q = this.search().trim().toLowerCase().replace(/\s+/g, '_');
        if (!q) return this.icons;
        return this.icons.filter((icon) => icon.includes(q));
    });

    get usesMaterialIcon(): boolean {
        return isMaterialIconName(this.value);
    }

    get usesLogo(): boolean {
        return isLogoPath(this.value);
    }

    onSearch(value: string): void {
        this.search.set(value);
    }

    pick(icon: string): void {
        this.valueChange.emit(icon);
        this.menuTrigger?.closeMenu();
    }

    useProviderLogo(): void {
        if (!this.providerLogo) return;
        this.valueChange.emit(this.providerLogo);
        this.menuTrigger?.closeMenu();
    }

    onMenuClosed(): void {
        this.search.set('');
    }
}
