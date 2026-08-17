import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TagService } from './tag.service';

describe('TagService', () => {
    let service: TagService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
        service = TestBed.inject(TagService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('should be created with empty tags', () => {
        expect(service).toBeTruthy();
        expect(service.tags()).toEqual([]);
    });

    it('should load global tags from the server', () => {
        service.loadTags().subscribe((names) => {
            expect(names).toEqual(['Groceries', 'Client Dinner']);
        });

        const req = httpMock.expectOne('/api/get-tags');
        expect(req.request.method).toBe('GET');
        req.flush([
            { id: 't-1', name: 'Groceries' },
            { id: 't-2', name: 'Client Dinner' },
        ]);

        expect(service.tags()).toEqual(['Groceries', 'Client Dinner']);
    });

    it('should load category tags from the server', () => {
        service.loadCategoryTags('cat-1').subscribe((names) => {
            expect(names).toEqual(['Tax-Deductible']);
        });

        const req = httpMock.expectOne('/api/get-category-tags/cat-1');
        expect(req.request.method).toBe('GET');
        req.flush(['Tax-Deductible']);

        expect(service.tagsForCategory('cat-1')).toEqual(['Tax-Deductible']);
    });

    it('should create a tag via the server and add it to the global list', () => {
        service.createTag('Vacation2026').subscribe((name) => {
            expect(name).toBe('Vacation2026');
        });

        const req = httpMock.expectOne('/api/create-tag');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ name: 'Vacation2026' });
        req.flush({ id: 't-3', name: 'Vacation2026' });

        expect(service.tags()).toContain('Vacation2026');
    });

    it('should create a tag bound to a category in one step', () => {
        service.createTagForCategory('Vacation2026', 'cat-1').subscribe((name) => {
            expect(name).toBe('Vacation2026');
        });

        httpMock.expectOne('/api/create-tag').flush({ id: 't-3', name: 'Vacation2026' });
        httpMock.expectOne('/api/assign-tag-to-category').flush(null);

        expect(service.tags()).toContain('Vacation2026');
        expect(service.tagsForCategory('cat-1')).toContain('Vacation2026');
    });

    it('should not create a blank tag', () => {
        service.createTag('   ').subscribe((name) => {
            expect(name).toBeNull();
        });
        expect(service.tags()).toEqual([]);
    });

    it('should return null when creating a tag fails', () => {
        service.createTag('Vacation2026').subscribe((name) => {
            expect(name).toBeNull();
        });

        const req = httpMock.expectOne('/api/create-tag');
        req.flush({ error: 'boom' }, { status: 400, statusText: 'Bad Request' });

        expect(service.tags()).toEqual([]);
    });

    it('should assign a tag to a category without duplicating', () => {
        service.assignTagToCategory('cat-1', 'Travel').subscribe(() => {});
        httpMock.expectOne('/api/assign-tag-to-category').flush(null);
        expect(service.tagsForCategory('cat-1')).toEqual(['Travel']);

        service.assignTagToCategory('cat-1', 'travel').subscribe(() => {});
        httpMock.expectOne('/api/assign-tag-to-category').flush(null);
        expect(service.tagsForCategory('cat-1')).toEqual(['Travel']);
        expect(service.isTagAssignedToCategory('cat-1', 'travel')).toBeTrue();
    });

    it('should unassign a tag from a category via the server', () => {
        service.assignTagToCategory('cat-1', 'Travel').subscribe(() => {});
        httpMock.expectOne('/api/assign-tag-to-category').flush(null);

        service.unassignTagFromCategory('cat-1', 'Travel').subscribe(() => {});
        const req = httpMock.expectOne(
            (r) => r.url === '/api/unassign-tag-from-category/cat-1' && r.method === 'DELETE',
        );
        expect(req.request.params.get('tag')).toBe('Travel');
        req.flush(null);

        expect(service.tagsForCategory('cat-1')).toEqual([]);
        expect(service.tags()).toEqual([]);
    });

    it('should scope category tags to the right category', () => {
        service.assignTagToCategory('cat-1', 'Vacation2026').subscribe(() => {});
        httpMock.expectOne('/api/assign-tag-to-category').flush(null);
        service.assignTagToCategory('cat-2', 'Client Dinner').subscribe(() => {});
        httpMock.expectOne('/api/assign-tag-to-category').flush(null);

        expect(service.tagsForCategory('cat-1')).toEqual(['Vacation2026']);
        expect(service.tagsForCategory('cat-2')).toEqual(['Client Dinner']);
    });
});
