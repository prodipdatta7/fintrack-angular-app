import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
    let fixture: ComponentFixture<StatCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [StatCardComponent] }).compileComponents();
        fixture = TestBed.createComponent(StatCardComponent);
        fixture.componentRef.setInput('title', 'Total Net Surplus');
        fixture.componentRef.setInput('amount', '$3,731.30');
        fixture.detectChanges();
    });

    it('should render the title and amount', () => {
        const host = fixture.nativeElement as HTMLElement;
        expect(host.querySelector('.stat-card-title')?.textContent?.trim()).toBe('Total Net Surplus');
        expect(host.querySelector('.stat-card-amount')?.textContent?.trim()).toBe('$3,731.30');
    });

    it('should default to the primary variant', () => {
        expect(fixture.nativeElement.querySelector('.stat-card').classList).toContain('stat-card--primary');
    });

    it('should apply the requested variant', () => {
        fixture.componentRef.setInput('variant', 'danger');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.stat-card').classList).toContain('stat-card--danger');
    });

    it('should omit the icon tile and subtitle when not provided', () => {
        expect(fixture.nativeElement.querySelector('.stat-card-icon')).toBeNull();
        expect(fixture.nativeElement.querySelector('.stat-card-subtitle')).toBeNull();
    });

    it('should render the icon ligature and subtitle when provided', () => {
        fixture.componentRef.setInput('icon', 'trending_up');
        fixture.componentRef.setInput('subtitle', 'Monthly Income vs Expense Delta');
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        expect(host.querySelector('.stat-card-icon .material-icons')?.textContent?.trim()).toBe('trending_up');
        expect(host.querySelector('.stat-card-subtitle')?.textContent?.trim()).toBe('Monthly Income vs Expense Delta');
    });
});
