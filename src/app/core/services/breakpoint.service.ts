import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';

export const BREAKPOINTS = {
    xs: '(max-width: 479.98px)',
    handset: '(max-width: 639.98px)',
    mobile: '(max-width: 767.98px)',
    tablet: '(min-width: 768px) and (max-width: 1023.98px)',
    desktop: '(min-width: 1024px)',
    widescreen: '(min-width: 1280px)',
} as const;

@Injectable({
    providedIn: 'root',
})
export class BreakpointService {
    private readonly breakpointObserver = inject(BreakpointObserver);
    private readonly platformId = inject(PLATFORM_ID);

    private readonly mobileState = toSignal(
        this.breakpointObserver.observe(BREAKPOINTS.mobile),
        {
            initialValue: { matches: false, breakpoints: {} } as BreakpointState,
        }
    );

    private readonly handsetState = toSignal(
        this.breakpointObserver.observe(BREAKPOINTS.handset),
        {
            initialValue: { matches: false, breakpoints: {} } as BreakpointState,
        }
    );

    private readonly tabletState = toSignal(
        this.breakpointObserver.observe(BREAKPOINTS.tablet),
        {
            initialValue: { matches: false, breakpoints: {} } as BreakpointState,
        }
    );

    private readonly desktopState = toSignal(
        this.breakpointObserver.observe(BREAKPOINTS.desktop),
        {
            initialValue: { matches: true, breakpoints: {} } as BreakpointState,
        }
    );

    private readonly widescreenState = toSignal(
        this.breakpointObserver.observe(BREAKPOINTS.widescreen),
        {
            initialValue: { matches: false, breakpoints: {} } as BreakpointState,
        }
    );

    /** True when viewport width is below 640px */
    readonly isHandset = computed(() => this.handsetState().matches);

    /** True when viewport width is below 768px (standard mobile) */
    readonly isMobile = computed(() => this.mobileState().matches);

    /** True when viewport width is between 768px and 1023.98px */
    readonly isTablet = computed(() => this.tabletState().matches);

    /** True when viewport width is 1024px or above */
    readonly isDesktop = computed(() => this.desktopState().matches);

    /** True when viewport width is 1280px or above */
    readonly isWidescreen = computed(() => this.widescreenState().matches);

    /** Device supports touch input */
    readonly isTouchDevice = computed(() => {
        if (!isPlatformBrowser(this.platformId)) return false;
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    });
}
