import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FilterPopoverComponent } from './filter-popover.component';

@Component({
    standalone: true,
    imports: [FilterPopoverComponent],
    template: `
        <app-filter-popover [activeCount]="count" [(open)]="isOpen" (reset)="resetCalls = resetCalls + 1">
            <div class="projected-body">Filter controls</div>
        </app-filter-popover>
    `,
})
class HostComponent {
    count = 0;
    isOpen = false;
    resetCalls = 0;
}

describe('FilterPopoverComponent', () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    const trigger = () => fixture.nativeElement.querySelector('.filter-trigger') as HTMLButtonElement;
    const panel = () => document.querySelector('.filter-panel') as HTMLElement | null;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HostComponent, NoopAnimationsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        host.isOpen = false;
        fixture.detectChanges();
    });

    it('should stay closed until the trigger is clicked', () => {
        expect(panel()).toBeNull();

        trigger().click();
        fixture.detectChanges();

        expect(panel()).toBeTruthy();
        expect(host.isOpen).toBeTrue();
    });

    it('should project the filter controls into the panel', () => {
        trigger().click();
        fixture.detectChanges();
        expect(panel()?.querySelector('.projected-body')?.textContent?.trim()).toBe('Filter controls');
    });

    it('should close on Escape', () => {
        trigger().click();
        fixture.detectChanges();

        panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        fixture.detectChanges();

        expect(host.isOpen).toBeFalse();
        expect(panel()).toBeNull();
    });

    it('should close from the Apply button', () => {
        trigger().click();
        fixture.detectChanges();

        (panel()!.querySelector('.filter-apply') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(host.isOpen).toBeFalse();
    });

    it('should show the active count badge and the engaged treatment', () => {
        expect(fixture.nativeElement.querySelector('.filter-count')).toBeNull();
        expect(trigger().classList).not.toContain('engaged');

        host.count = 4;
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.filter-count').textContent.trim()).toBe('4');
        expect(trigger().classList).toContain('engaged');
    });

    it('should surface the reset action only while filters are active', () => {
        trigger().click();
        fixture.detectChanges();
        expect(panel()!.querySelector('.filter-reset')).toBeNull();

        host.count = 2;
        fixture.detectChanges();

        (panel()!.querySelector('.filter-reset') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(host.resetCalls).toBe(1);
    });
});
