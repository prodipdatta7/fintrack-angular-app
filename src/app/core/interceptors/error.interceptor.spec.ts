import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { ToastService } from '../services/toast.service';

describe('errorInterceptor', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;
    let toastService: ToastService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([errorInterceptor])),
                provideHttpClientTesting(),
                ToastService,
            ],
        });

        http = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
        toastService = TestBed.inject(ToastService);
    });

    afterEach(() => {
        httpMock.verify();
        toastService.clear();
    });

    it('should show an error toast when HTTP 500 occurs', () => {
        http.get('/api/test').subscribe({ error: () => {} });

        const req = httpMock.expectOne('/api/test');
        req.flush({ message: 'Internal Database Failure' }, { status: 500, statusText: 'Server Error' });

        const toasts = toastService.toasts();
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe('error');
        expect(toasts[0].message).toBe('Internal Database Failure');
    });

    it('should show a friendly connection message for status 0', () => {
        http.get('/api/test').subscribe({ error: () => {} });

        const req = httpMock.expectOne('/api/test');
        req.error(new ProgressEvent('error'), { status: 0 });

        const toasts = toastService.toasts();
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe('error');
        expect(toasts[0].message).toContain('Unable to connect to server');
    });

    it('should not intercept status 401 (delegated to authInterceptor)', () => {
        http.get('/api/test').subscribe({ error: () => {} });

        const req = httpMock.expectOne('/api/test');
        req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        expect(toastService.toasts().length).toBe(0);
    });
});
