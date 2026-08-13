import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
    let httpMock: HttpTestingController;
    let httpClient: HttpClient;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        authServiceSpy = jasmine.createSpyObj<AuthService>(
            'AuthService',
            ['getToken', 'isAuthenticated', 'logout'],
        );
        authServiceSpy.getToken.and.resolveTo('firebase-id-token');
        authServiceSpy.isAuthenticated.and.returnValue(true);
        authServiceSpy.logout.and.resolveTo();

        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
        routerSpy.navigate.and.resolveTo(true);

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        });

        httpMock = TestBed.inject(HttpTestingController);
        httpClient = TestBed.inject(HttpClient);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should attach the Firebase ID token as a Bearer header', async () => {
        httpClient.get('/api/transactions').subscribe();

        await flushPromises();
        const req = httpMock.expectOne('/api/transactions');
        expect(req.request.headers.get('Authorization')).toBe('Bearer firebase-id-token');
        expect(req.request.withCredentials).toBeFalse();
        req.flush({});
    });

    it('should not attach an Authorization header when there is no token', async () => {
        authServiceSpy.getToken.and.resolveTo(null);

        httpClient.get('/api/transactions').subscribe();

        await flushPromises();
        const req = httpMock.expectOne('/api/transactions');
        expect(req.request.headers.has('Authorization')).toBeFalse();
        req.flush({});
    });

    it('should retry once with a forced token refresh when the first call returns 401', async () => {
        const tokens = ['stale-token', 'fresh-token'];
        authServiceSpy.getToken.and.callFake(() => Promise.resolve(tokens.shift() ?? null));

        let response: unknown;
        httpClient.get('/api/transactions').subscribe((r) => (response = r));

        await flushPromises();
        const first = httpMock.expectOne('/api/transactions');
        expect(first.request.headers.get('Authorization')).toBe('Bearer stale-token');
        first.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        await flushPromises();
        expect(authServiceSpy.getToken).toHaveBeenCalledWith(true);

        const retried = httpMock.expectOne('/api/transactions');
        expect(retried.request.headers.get('Authorization')).toBe('Bearer fresh-token');
        retried.flush({ ok: true });

        expect(response).toEqual({ ok: true });
    });

    it('should not retry on 401 when the user is no longer authenticated', async () => {
        authServiceSpy.isAuthenticated.and.returnValue(false);

        httpClient.get('/api/transactions').subscribe({ error: () => undefined });

        await flushPromises();
        const req = httpMock.expectOne('/api/transactions');
        req.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        expect(authServiceSpy.getToken).not.toHaveBeenCalledWith(true);
        expect(authServiceSpy.logout).not.toHaveBeenCalled();
    });

    it('should log out and navigate to login when the forced token refresh yields no token', async () => {
        const tokens: (string | null)[] = ['stale-token', null];
        authServiceSpy.getToken.and.callFake(() => Promise.resolve(tokens.shift() ?? null));

        httpClient.get('/api/transactions').subscribe({ error: () => undefined });

        await flushPromises();
        const req = httpMock.expectOne('/api/transactions');
        req.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        await flushPromises();
        expect(authServiceSpy.logout).toHaveBeenCalled();
        await flushPromises();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should log out and navigate to login when forced refresh throws', async () => {
        authServiceSpy.getToken.and.callFake((forceRefresh?: boolean) => {
            if (forceRefresh) {
                return Promise.reject(new Error('refresh failed'));
            }
            return Promise.resolve('stale-token');
        });

        httpClient.get('/api/transactions').subscribe({ error: () => undefined });

        await flushPromises();
        const req = httpMock.expectOne('/api/transactions');
        req.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        await flushPromises();
        expect(authServiceSpy.logout).toHaveBeenCalled();
        await flushPromises();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
});

async function flushPromises(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}
