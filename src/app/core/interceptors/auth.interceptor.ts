import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const token = authService.token();

  let authReq = req.clone({
    withCredentials: true,
    ...(token && !req.url.includes('/auth/login') && !req.url.includes('/auth/register') ? {
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    } : {})
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthUrl = req.url.includes('/auth/');
      if (error.status === 401 && !isAuthUrl) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshTokens().pipe(
            switchMap((newToken) => {
              isRefreshing = false;
              const tokenStr = newToken.accessToken || newToken.token || authService.token() || '';
              refreshTokenSubject.next(tokenStr);
              const retryReq = req.clone({
                withCredentials: true,
                ...(tokenStr ? {
                  setHeaders: {
                    Authorization: `Bearer ${tokenStr}`
                  }
                } : {})
              });
              return next(retryReq);
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              authService.logout();
              return throwError(() => refreshErr);
            })
          );
        } else {
          return refreshTokenSubject.pipe(
            filter((t): t is string => t !== null),
            take(1),
            switchMap((newToken) => {
              const retryReq = req.clone({
                withCredentials: true,
                ...(newToken ? {
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`
                  }
                } : {})
              });
              return next(retryReq);
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
