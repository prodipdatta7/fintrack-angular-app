import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authReady.then(() => {
        if (!authService.isAuthenticated()) {
            return router.createUrlTree(['/login'], {
                queryParams: { returnUrl: state.url },
            });
        }

        if (authService.isAdmin()) {
            return true;
        }

        return router.createUrlTree(['/dashboard']);
    });
};
