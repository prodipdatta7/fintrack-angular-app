import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthResponse } from '../models/auth.model';

let refreshInProgress: Observable<AuthResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authService = inject(AuthService);
    const token = authService.token();

    let authReq = req.clone({
        withCredentials: true,
        ...(token && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')
            ? {
                  setHeaders: {
                      Authorization: `Bearer ${token}`,
                  },
              }
            : {}),
    });

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            const isAuthUrl = req.url.includes('/auth/');
            if (error.status !== 401 || isAuthUrl) {
                return throwError(() => error);
            }

            if (!refreshInProgress) {
                refreshInProgress = authService.refreshTokens().pipe(
                    finalize(() => {
                        refreshInProgress = null;
                    }),
                );
            }

            return refreshInProgress.pipe(
                switchMap((newToken) => {
                    const tokenStr = newToken.accessToken || newToken.token || authService.token() || '';
                    const retryReq = req.clone({
                        withCredentials: true,
                        ...(tokenStr
                            ? {
                                  setHeaders: {
                                      Authorization: `Bearer ${tokenStr}`,
                                  },
                              }
                            : {}),
                    });
                    return next(retryReq);
                }),
                catchError((refreshErr) => {
                    authService.logout();
                    return throwError(() => refreshErr);
                }),
            );
        }),
    );
};
