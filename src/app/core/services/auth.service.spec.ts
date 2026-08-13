import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/auth.model';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    it('should authenticate user and store tokens on login', () => {
        const dummyResponse: AuthResponse = {
            userId: 'user-123',
            email: 'test@example.com',
            token: 'jwt-access-token',
            refreshToken: 'jwt-refresh-token',
        };

        service.login({ email: 'test@example.com', password: 'password123' }).subscribe((res) => {
            expect(res).toEqual(dummyResponse);
            expect(service.token()).toBe('jwt-access-token');
            expect(service.isAuthenticated()).toBeTrue();
            expect(localStorage.getItem('token')).toBe('jwt-access-token');
        });

        const req = httpMock.expectOne('/api/login');
        expect(req.request.method).toBe('POST');
        req.flush(dummyResponse);
    });

    it('should clear stored state on logout', () => {
        localStorage.setItem('token', 'sample-token');
        service.logout();

        const req = httpMock.expectOne('/api/logout');
        expect(req.request.method).toBe('POST');
        req.flush({ message: 'Logged out successfully.' });

        expect(service.token()).toBeNull();
        expect(service.currentUser()).toBeNull();
        expect(service.isAuthenticated()).toBeFalse();
        expect(localStorage.getItem('token')).toBeNull();
    });
});
