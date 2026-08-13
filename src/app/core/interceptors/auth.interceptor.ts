import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthResponse } from '../models/auth.model';

let refreshInProgress: Observable<AuthResponse> | null = null;

/** Auth endpoints that must not attach Bearer or trigger a refresh loop. */
function isAnonymousAuthUrl(url: string): boolean {
    return (
        /\/login(\?|$)/.test(url) ||
        /\/register(\?|$)/.test(url) ||
        /\/refresh-token(\?|$)/.test(url) ||
        /\/logout(\?|$)/.test(url)
    );
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authService = inject(AuthService);
    const token = authService.token();

    let authReq = req.clone({
        withCredentials: true,
        ...(token && !isAnonymousAuthUrl(req.url)
            ? {
                  setHeaders: {
                      Authorization: `Bearer ${token}`,
                  },
              }
            : {}),
    });

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status !== 401 || isAnonymousAuthUrl(req.url)) {
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
