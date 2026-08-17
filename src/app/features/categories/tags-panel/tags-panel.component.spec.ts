import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TagsPanelComponent, TAG_COLOR_PALETTE } from './tags-panel.component';

describe('TagsPanelComponent', () => {
    let fixture: ComponentFixture<TagsPanelComponent>;
    let component: TagsPanelComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TagsPanelComponent, NoopAnimationsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(TagsPanelComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('categoryId', 'cat-1');
        fixture.componentRef.setInput('assignedTags', ['Groceries', 'Travel', 'Reimbursable']);
        fixture.componentRef.setInput('availableTags', ['Bonus', 'Freelance', 'Savings', 'Gift']);
        fixture.detectChanges();
    });

    it('should render the assigned tags as uniform tag cards', () => {
        const cards = fixture.nativeElement.querySelectorAll('.tp-tag-card');
        expect(cards.length).toBe(3);
        expect(cards[0].textContent).toContain('Groceries');
        expect(cards[0].querySelector('.tp-tag-count').textContent.trim()).toMatch(/^\d+$/);
    });

    it('should derive a stable deterministic color and item count per tag', () => {
        const first = component.assignedCards()[0];
        const second = component.assignedCards()[0];
        expect(second.color).toBe(first.color);
        expect(second.itemCount).toBe(first.itemCount);
        expect(TAG_COLOR_PALETTE.some((swatch) => swatch.value === first.color)).toBeTrue();
        expect(first.itemCount).toBeGreaterThan(0);
    });

    it('should expose a badge with the assigned count', () => {
        const badge = fixture.nativeElement.querySelector('.tp-badge');
        expect(badge.textContent).toContain('3');
    });

    it('should show an empty state with a create action when nothing is assigned', () => {
        fixture.componentRef.setInput('assignedTags', []);
        fixture.componentRef.setInput('availableTags', []);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.tp-empty')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.tp-tag-card')).toBeFalsy();
    });

    it('should render the assigned search bar when assigned tags exist', () => {
        expect(component.showAssignedSearch()).toBeTrue();
        expect(fixture.nativeElement.querySelector('.tp-search')).toBeTruthy();

        fixture.componentRef.setInput('assignedTags', []);
        fixture.detectChanges();
        expect(component.showAssignedSearch()).toBeFalse();
        expect(fixture.nativeElement.querySelector('.tp-search')).toBeFalsy();
    });

    it('should filter assigned tags by query', () => {
        fixture.componentRef.setInput(
            'assignedTags',
            Array.from({ length: 10 }, (_, i) => `Tag ${i + 1}`),
        );
        fixture.detectChanges();

        component.assignedQuery.set('Tag 1');
        fixture.detectChanges();
        expect(component.filteredAssigned().length).toBe(2);
        expect(component.filteredAssigned().every((card) => card.name.toLowerCase().includes('tag 1'))).toBeTrue();
    });

    it('should require a confirmation click before emitting unassign', () => {
        const spy = jasmine.createSpy('unassign');
        component.unassignRequest.subscribe(spy);

        component.requestUnbind('Groceries');
        expect(spy).not.toHaveBeenCalled();
        expect(component.confirming()).toBe('Groceries');

        component.requestUnbind('Groceries');
        expect(spy).toHaveBeenCalledWith('Groceries');
        expect(component.confirming()).toBeNull();
    });

    it('should open the modal on assign and switch tabs', () => {
        component.openModal('existing');
        expect(component.modalOpen()).toBeTrue();
        expect(component.activeTab()).toBe('existing');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.tp-overlay')).toBeTruthy();
    });

    it('should select pool tags and emit a bulk assign request', () => {
        component.openModal('existing');
        fixture.detectChanges();

        const spy = jasmine.createSpy('assign');
        component.assignRequest.subscribe(spy);

        component.toggleSelect('Bonus');
        component.toggleSelect('Freelance');
        expect(component.selectionCount()).toBe(2);
        expect(component.isAllSelected()).toBeFalse();

        component.submitAssign();
        expect(spy).toHaveBeenCalledWith(['Bonus', 'Freelance']);
        expect(component.modalOpen()).toBeFalse();
    });

    it('should select and deselect every filtered pool tag', () => {
        component.openModal('existing');
        fixture.detectChanges();

        component.toggleAll();
        expect(component.selectionCount()).toBe(4);
        expect(component.isAllSelected()).toBeTrue();

        component.toggleAll();
        expect(component.selectionCount()).toBe(0);
    });

    it('should filter the global pool by color', () => {
        component.openModal('existing');
        fixture.detectChanges();

        const color = component.poolCards()[0].color;
        component.colorFilter.set(color);
        expect(component.filteredPool().every((card) => card.color === color)).toBeTrue();
    });

    it('should filter the global pool by query text', () => {
        component.openModal('existing');
        fixture.detectChanges();

        component.poolQuery.set('bon');
        expect(component.filteredPool().map((card) => card.name)).toEqual(['Bonus']);
    });

    it('should create a tag from the form and emit with the auto-assign flag', () => {
        component.openModal('create');
        fixture.detectChanges();

        const spy = jasmine.createSpy('create');
        component.createRequest.subscribe(spy);

        component.onNameChange('Side Hustle');
        component.autoAssign.set(true);
        expect(component.slugPreview()).toBe('side-hustle');
        expect(component.nameCount()).toBe(11);
        expect(component.canCreate()).toBeTrue();

        component.submitCreate();
        expect(spy).toHaveBeenCalledWith({ name: 'Side Hustle', autoAssign: true });
        expect(component.modalOpen()).toBeFalse();
    });

    it('should reject an empty tag name with a validation error', () => {
        component.openModal('create');
        fixture.detectChanges();

        const spy = jasmine.createSpy('create');
        component.createRequest.subscribe(spy);

        component.onNameChange('   ');
        component.submitCreate();
        expect(spy).not.toHaveBeenCalled();
        expect(component.createError()).toContain('required');
    });

    it('should reject a duplicate tag name (case-insensitive)', () => {
        component.openModal('create');
        fixture.detectChanges();

        const spy = jasmine.createSpy('create');
        component.createRequest.subscribe(spy);

        component.onNameChange('groceries');
        expect(component.nameDuplicate()).toBeTrue();
        component.submitCreate();
        expect(spy).not.toHaveBeenCalled();
        expect(component.createError()).toContain('already exists');
    });

    it('should reject tag names over 30 characters', () => {
        component.openModal('create');
        fixture.detectChanges();

        const spy = jasmine.createSpy('create');
        component.createRequest.subscribe(spy);

        component.onNameChange('A'.repeat(31));
        expect(component.nameTooLong()).toBeTrue();
        component.submitCreate();
        expect(spy).not.toHaveBeenCalled();
    });

    it('should close the modal when the overlay is clicked', () => {
        component.openModal('existing');
        fixture.detectChanges();

        const overlay = fixture.nativeElement.querySelector('.tp-overlay');
        overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();

        expect(component.modalOpen()).toBeFalse();
    });
});
