import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastHostComponent } from '../../shared/components/toast-host/toast-host.component';
import { UserService } from '../../core/services/user.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [RouterOutlet, SidebarComponent, ToastHostComponent],
    templateUrl: './app-layout.component.html',
    styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly userService = inject(UserService);

    readonly pageTitle = signal(this.resolveTitle());

    constructor() {
        this.userService.getSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => undefined });

        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => this.pageTitle.set(this.resolveTitle()));
    }

    newTransaction(): void {
        this.router.navigate(['/transactions/new']);
    }

    /**
     * Walks to the deepest route that declares a title.
     *
     * Runs once at construction — while the router is still activating, so a
     * child route can exist in the tree before its snapshot is assigned — and
     * again on every NavigationEnd. Every hop must therefore tolerate a missing
     * snapshot rather than assume one.
     */
    private resolveTitle(): string {
        let route: ActivatedRoute | null = this.route;
        let title: string | undefined;

        while (route) {
            title = route.snapshot?.data?.['title'] ?? title;
            route = route.firstChild;
        }

        return title ?? 'FinTrack';
    }
}
