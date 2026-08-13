import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
    let service: ToastService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [ToastService] });
        service = TestBed.inject(ToastService);
    });

    afterEach(() => service.clear());

    it('should queue a toast with the default success type', () => {
        service.show('Account balance adjusted');
        expect(service.toasts().length).toBe(1);
        expect(service.toasts()[0].message).toBe('Account balance adjusted');
        expect(service.toasts()[0].type).toBe('success');
    });

    it('should auto-dismiss after 3 seconds', fakeAsync(() => {
        service.show('New transaction recorded');
        expect(service.toasts().length).toBe(1);

        tick(2999);
        expect(service.toasts().length).toBe(1);

        tick(1);
        expect(service.toasts().length).toBe(0);
    }));

    it('should give each toast a unique id even within the same tick', () => {
        service.show('one');
        service.show('two');
        service.show('three');

        const ids = service.toasts().map((t) => t.id);
        expect(new Set(ids).size).toBe(3);
        service.clear();
    });

    it('should dismiss manually and cancel the pending timer', fakeAsync(() => {
        service.show('Transaction removed');
        const id = service.toasts()[0].id;

        service.dismiss(id);
        expect(service.toasts().length).toBe(0);

        // No pending timer should remain — tick() would throw on a leaked one.
        tick(3000);
        expect(service.toasts().length).toBe(0);
    }));

    it('should expose an error shorthand', fakeAsync(() => {
        service.error('Failed to load accounts');
        expect(service.toasts()[0].type).toBe('error');
        tick(3000);
    }));

    it('should clear every queued toast', fakeAsync(() => {
        service.show('one');
        service.show('two');
        service.clear();
        expect(service.toasts()).toEqual([]);
        tick(3000);
    }));
});
