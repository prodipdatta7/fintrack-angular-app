import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard, redirectIfAuth } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        authServiceSpy = jasmine.createSpyObj<AuthService>(
            'AuthService',
            ['isAuthenticated'],
        );
        (authServiceSpy as unknown as { authReady: Promise<void> }).authReady = Promise.resolve();
        routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: authServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        });
    });

    it('should wait for authReady before deciding', async () => {
        let resolveReady!: () => void;
        (authServiceSpy as unknown as { authReady: Promise<void> }).authReady = new Promise<void>((resolve) => {
            resolveReady = resolve;
        });
        authServiceSpy.isAuthenticated.and.returnValue(true);

        let settled: boolean | UrlTree | undefined;
        const guardResult = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
        const pending = (async () => {
            const r = await guardResult;
            settled = r as boolean | UrlTree;
            return r;
        })();

        await Promise.resolve();
        expect(settled).toBeUndefined();

        resolveReady();
        await pending;
        expect(settled).toBeTrue();
    });

    it('should allow activation when the user is authenticated', async () => {
        authServiceSpy.isAuthenticated.and.returnValue(true);

        const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
        expect(result).toBeTrue();
    });

    it('should redirect to /login with the returnUrl when unauthenticated', async () => {
        authServiceSpy.isAuthenticated.and.returnValue(false);
        const mockTree = {} as UrlTree;
        routerSpy.createUrlTree.and.returnValue(mockTree);
        const mockState = { url: '/transactions/details/tx-1' } as never;

        const result = await TestBed.runInInjectionContext(() => authGuard({} as never, mockState));

        expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login'], {
            queryParams: { returnUrl: '/transactions/details/tx-1' },
        });
        expect(result).toBe(mockTree);
    });

    it('redirectIfAuth should redirect authenticated users to /dashboard', async () => {
        authServiceSpy.isAuthenticated.and.returnValue(true);
        const mockTree = {} as UrlTree;
        routerSpy.createUrlTree.and.returnValue(mockTree);

        const result = await TestBed.runInInjectionContext(() => redirectIfAuth({} as never, {} as never));

        expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
        expect(result).toBe(mockTree);
    });

    it('redirectIfAuth should allow unauthenticated users through', async () => {
        authServiceSpy.isAuthenticated.and.returnValue(false);

        const result = await TestBed.runInInjectionContext(() => redirectIfAuth({} as never, {} as never));
        expect(result).toBeTrue();
    });
});
