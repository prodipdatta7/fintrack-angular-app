import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { BreakpointService, BREAKPOINTS } from './breakpoint.service';

describe('BreakpointService', () => {
    let service: BreakpointService;
    let mockObserver: jasmine.SpyObj<BreakpointObserver>;

    beforeEach(() => {
        mockObserver = jasmine.createSpyObj('BreakpointObserver', ['observe', 'isMatched']);
        mockObserver.observe.and.callFake((query: string | readonly string[]) => {
            const isMobileQuery = query === BREAKPOINTS.mobile;
            const isHandsetQuery = query === BREAKPOINTS.handset;
            const isTabletQuery = query === BREAKPOINTS.tablet;
            const isDesktopQuery = query === BREAKPOINTS.desktop;
            const isWidescreenQuery = query === BREAKPOINTS.widescreen;

            return of({
                matches: isDesktopQuery,
                breakpoints: {},
            } as BreakpointState);
        });

        TestBed.configureTestingModule({
            providers: [
                BreakpointService,
                { provide: BreakpointObserver, useValue: mockObserver },
            ],
        });

        service = TestBed.inject(BreakpointService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should query the canonical media query breakpoints', () => {
        expect(mockObserver.observe).toHaveBeenCalledWith(BREAKPOINTS.mobile);
        expect(mockObserver.observe).toHaveBeenCalledWith(BREAKPOINTS.handset);
        expect(mockObserver.observe).toHaveBeenCalledWith(BREAKPOINTS.tablet);
        expect(mockObserver.observe).toHaveBeenCalledWith(BREAKPOINTS.desktop);
        expect(mockObserver.observe).toHaveBeenCalledWith(BREAKPOINTS.widescreen);
    });

    it('should reflect desktop matching by default from mock', () => {
        expect(service.isDesktop()).toBeTrue();
        expect(service.isMobile()).toBeFalse();
        expect(service.isTablet()).toBeFalse();
        expect(service.isHandset()).toBeFalse();
    });

    it('should detect touch device capabilities in browser environment', () => {
        expect(typeof service.isTouchDevice()).toBe('boolean');
    });
});
