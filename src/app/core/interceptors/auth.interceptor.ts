import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Module-level single-flight: one forced ID-token refresh at a time.
let refreshInFlight: Promise<string | null> | null = null;

async function forceLogout(authService: AuthService, router: Router): Promise<void> {
    await authService.logout();
    await router.navigate(['/login']);
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return from(authService.getToken()).pipe(
        switchMap((token) =>
            next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req),
        ),
        catchError((error: HttpErrorResponse) => {
            if (error.status !== 401 || !authService.isAuthenticated()) {
                return throwError(() => error);
            }

            if (!refreshInFlight) {
                refreshInFlight = authService
                    .getToken(true)
                    .finally(() => {
                        refreshInFlight = null;
                    });
            }

            return from(refreshInFlight).pipe(
                switchMap((fresh) => {
                    if (!fresh) {
                        void forceLogout(authService, router);
                        return throwError(() => error);
                    }
                    return next(req.clone({ setHeaders: { Authorization: `Bearer ${fresh}` } }));
                }),
                catchError((refreshErr) => {
                    void forceLogout(authService, router);
                    return throwError(() => refreshErr);
                }),
            );
        }),
    );
};
