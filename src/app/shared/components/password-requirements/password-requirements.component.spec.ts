import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordRequirementsComponent } from './password-requirements.component';
import { By } from '@angular/platform-browser';

describe('PasswordRequirementsComponent', () => {
    let component: PasswordRequirementsComponent;
    let fixture: ComponentFixture<PasswordRequirementsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PasswordRequirementsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PasswordRequirementsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not show panel when password is empty and showWhenEmpty is false', () => {
        component.password = '';
        component.showWhenEmpty = false;
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('.password-req-panel'))).toBeNull();
    });

    it('should show panel when showWhenEmpty is true even if password is empty', () => {
        component.password = '';
        component.showWhenEmpty = true;
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('.password-req-panel'))).not.toBeNull();
    });

    it('should evaluate password strength correctly for weak password', () => {
        component.password = 'abc';
        fixture.detectChanges();

        const evalRes = component.evaluation();
        expect(evalRes.hasLower).toBeTrue();
        expect(evalRes.hasUpper).toBeFalse();
        expect(evalRes.hasDigit).toBeFalse();
        expect(evalRes.hasSpecial).toBeFalse();
        expect(evalRes.hasLength).toBeFalse();
        expect(evalRes.strengthTag).toBe('LOW');

        const tag = fixture.debugElement.query(By.css('.strength-tag'));
        expect(tag.nativeElement.textContent.trim()).toBe('LOW');
    });

    it('should evaluate password strength correctly for medium password', () => {
        component.password = 'Abc12345'; // Upper, Lower, Digit, Length (4 met)
        fixture.detectChanges();

        const evalRes = component.evaluation();
        expect(evalRes.strengthTag).toBe('MEDIUM');
        expect(evalRes.score).toBe(4);
    });

    it('should evaluate password strength correctly for strong password', () => {
        component.password = 'FinTrack@2026'; // Upper, Lower, Digit, Special, Length (5 met)
        fixture.detectChanges();

        const evalRes = component.evaluation();
        expect(evalRes.strengthTag).toBe('HIGH');
        expect(evalRes.isValid).toBeTrue();
        expect(evalRes.score).toBe(5);

        const matchedItems = fixture.debugElement.queryAll(By.css('.requirement-item.matched'));
        expect(matchedItems.length).toBe(5);
    });
});
