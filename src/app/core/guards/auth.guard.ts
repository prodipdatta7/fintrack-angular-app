import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authReady.then(() => {
        if (authService.isAuthenticated()) {
            return true;
        }

        return router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
        });
    });
};

export const redirectIfAuth: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authReady.then(() =>
        authService.isAuthenticated()
            ? router.createUrlTree(['/dashboard'])
            : true,
    );
};
