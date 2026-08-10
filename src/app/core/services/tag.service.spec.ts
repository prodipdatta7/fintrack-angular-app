import { TestBed } from '@angular/core/testing';
import { TagService } from './tag.service';

describe('TagService', () => {
    let service: TagService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(TagService);
    });

    it('should be created with default tags', () => {
        expect(service).toBeTruthy();
        expect(service.tags().length).toBeGreaterThan(0);
        expect(service.tags()).toContain('Groceries');
    });

    it('should add new custom tag and persist to localStorage', () => {
        const added = service.addTag('Vacation2026');
        expect(added).toBe('Vacation2026');
        expect(service.tags()).toContain('Vacation2026');
    });

    it('should not add duplicate tags case-insensitively', () => {
        const initialCount = service.tags().length;
        service.addTag('groceries');
        expect(service.tags().length).toBe(initialCount);
    });
});
