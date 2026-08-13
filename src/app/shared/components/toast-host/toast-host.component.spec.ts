import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastHostComponent } from './toast-host.component';
import { ToastService } from '../../../core/services/toast.service';

describe('ToastHostComponent', () => {
    let fixture: ComponentFixture<ToastHostComponent>;
    let toastService: ToastService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ToastHostComponent],
            providers: [ToastService],
        }).compileComponents();

        toastService = TestBed.inject(ToastService);
        fixture = TestBed.createComponent(ToastHostComponent);
        fixture.detectChanges();
    });

    afterEach(() => toastService.clear());

    it('should render nothing while the queue is empty', () => {
        expect(fixture.nativeElement.querySelector('.toast-stack')).toBeNull();
    });

    it('should render one toast per queued message', fakeAsync(() => {
        toastService.show('Account balance adjusted');
        toastService.error('Failed to load accounts');
        fixture.detectChanges();

        const toasts = Array.from(fixture.nativeElement.querySelectorAll('.toast')) as HTMLElement[];
        expect(toasts.length).toBe(2);
        expect(toasts[0].textContent).toContain('Account balance adjusted');
        expect(toasts[0].classList).toContain('toast--success');
        expect(toasts[1].classList).toContain('toast--error');

        tick(3000);
    }));

    it('should dismiss a toast when clicked', fakeAsync(() => {
        toastService.show('New transaction recorded');
        fixture.detectChanges();

        (fixture.nativeElement.querySelector('.toast') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.toast')).toBeNull();
        tick(3000);
    }));

    it('should map each type to its icon', () => {
        expect(fixture.componentInstance.icon('success')).toBe('check_circle');
        expect(fixture.componentInstance.icon('error')).toBe('error_outline');
        expect(fixture.componentInstance.icon('info')).toBe('info');
    });
});
