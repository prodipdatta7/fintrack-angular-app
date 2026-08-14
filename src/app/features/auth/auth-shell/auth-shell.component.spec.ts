import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthShellComponent } from './auth-shell.component';

@Component({
    standalone: true,
    imports: [AuthShellComponent],
    template: `
        <app-auth-shell heading="Welcome back" subheading="Sign in to continue">
            <form class="projected-form"></form>
        </app-auth-shell>
    `,
})
class HostComponent {}

@Component({ standalone: true, template: '' })
class BlankComponent {}

describe('AuthShellComponent', () => {
    let fixture: ComponentFixture<HostComponent>;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HostComponent],
            providers: [
                provideRouter([
                    { path: 'login', component: BlankComponent },
                    { path: 'register', component: BlankComponent },
                ]),
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
    });

    it('should render the heading, subheading and projected form', () => {
        const host = fixture.nativeElement as HTMLElement;
        expect(host.querySelector('.auth-title')?.textContent?.trim()).toBe('Welcome back');
        expect(host.querySelector('.auth-subtitle')?.textContent?.trim()).toBe('Sign in to continue');
        expect(host.querySelector('.projected-form')).toBeTruthy();
    });

    it('should offer both authentication routes', () => {
        const links = Array.from(fixture.nativeElement.querySelectorAll('.auth-switch a')) as HTMLAnchorElement[];
        expect(links.map((link) => link.textContent?.trim())).toEqual(['Sign In', 'Sign Up']);
        expect(links.map((link) => link.getAttribute('href'))).toEqual(['/login', '/register']);
    });

    it('should mark the active route in the switch', async () => {
        await router.navigate(['/register']);
        fixture.detectChanges();

        const links = Array.from(fixture.nativeElement.querySelectorAll('.auth-switch a')) as HTMLAnchorElement[];
        expect(links[0].classList).not.toContain('active');
        expect(links[1].classList).toContain('active');
    });

    it('should render the brand mark and headline', () => {
        const host = fixture.nativeElement as HTMLElement;
        expect(host.querySelector('.auth-brand-text')?.textContent?.trim()).toBe('FinTrack');
        expect(host.querySelector('.brand-headline')?.textContent).toContain('Take full control');
    });
});
