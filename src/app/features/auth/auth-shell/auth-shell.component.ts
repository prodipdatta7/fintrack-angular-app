import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Shared frame for the login and register pages: ambient orbs, glass card,
 * brand mark and the Sign In / Create Account switch.
 *
 * The switch is two router links rather than local state, so both pages stay
 * real routes and the auth guards keep working unchanged.
 */
@Component({
    selector: 'app-auth-shell',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './auth-shell.component.html',
    styleUrl: './auth-shell.component.scss',
})
export class AuthShellComponent {
    readonly heading = input.required<string>();
    readonly subheading = input('');
}
