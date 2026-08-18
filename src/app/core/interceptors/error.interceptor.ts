import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toast = inject(ToastService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // 401 Unauthorized is handled by authInterceptor (refresh token flow / logout)
            if (error.status !== 401) {
                let message = 'An unexpected error occurred. Please try again.';

                if (error.status === 0) {
                    message = 'Unable to connect to server. Please check your network connection.';
                } else if (typeof error.error === 'string' && error.error.trim()) {
                    message = error.error;
                } else if (error.error?.message) {
                    message = error.error.message;
                } else if (error.error?.detail) {
                    message = error.error.detail;
                } else if (error.error?.title) {
                    message = error.error.title;
                } else if (error.status === 404) {
                    message = 'Requested resource was not found.';
                } else if (error.status === 403) {
                    message = 'You do not have permission to perform this action.';
                } else if (error.status >= 500) {
                    message = 'Server encountered an error. Please try again in a moment.';
                }

                toast.error(message);
            }

            return throwError(() => error);
        }),
    );
};
