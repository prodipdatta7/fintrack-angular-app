import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('adminGuard', () => {
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated']);
        Object.defineProperty(authServiceSpy, 'isAdmin', {
            value: jasmine.createSpy('isAdmin').and.returnValue(false),
            writable: true,
        });
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
        (authServiceSpy.isAdmin as jasmine.Spy).and.returnValue(true);

        let settled: boolean | UrlTree | undefined;
        const guardResult = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
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

    it('should allow activation when user is authenticated and isAdmin is true', async () => {
        authServiceSpy.isAuthenticated.and.returnValue(true);
        (authServiceSpy.isAdmin as jasmine.Spy).and.returnValue(true);

        const result = await TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
        expect(result).toBeTrue();
    });

    it('should redirect to /dashboard when user is authenticated but isAdmin is false', async () => {
        authServiceSpy.isAuthenticated.and.returnValue(true);
        (authServiceSpy.isAdmin as jasmine.Spy).and.returnValue(false);
        const mockTree = {} as UrlTree;
        routerSpy.createUrlTree.and.returnValue(mockTree);

        const result = await TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

        expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
        expect(result).toBe(mockTree);
    });

    it('should redirect to /login with returnUrl when user is unauthenticated', async () => {
        authServiceSpy.isAuthenticated.and.returnValue(false);
        const mockTree = {} as UrlTree;
        routerSpy.createUrlTree.and.returnValue(mockTree);
        const mockState = { url: '/admin' } as never;

        const result = await TestBed.runInInjectionContext(() => adminGuard({} as never, mockState));

        expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login'], {
            queryParams: { returnUrl: '/admin' },
        });
        expect(result).toBe(mockTree);
    });
});
