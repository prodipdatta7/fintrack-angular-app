import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePickerComponent } from './date-picker.component';
import { provideNativeDateAdapter } from '@angular/material/core';

describe('DatePickerComponent', () => {
    let component: DatePickerComponent;
    let fixture: ComponentFixture<DatePickerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DatePickerComponent],
            providers: [provideNativeDateAdapter()],
        }).compileComponents();

        fixture = TestBed.createComponent(DatePickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should convert YYYY-MM-DD string value to Date object', () => {
        fixture.componentRef.setInput('value', '2026-08-17');
        fixture.detectChanges();

        const date = component.dateObject();
        expect(date).toBeTruthy();
        expect(date?.getFullYear()).toBe(2026);
        expect(date?.getMonth()).toBe(7); // 0-indexed August
        expect(date?.getDate()).toBe(17);
    });

    it('should emit formatted YYYY-MM-DD string on onDateChange', () => {
        const emitted: string[] = [];
        component.valueChange.subscribe((v) => emitted.push(v));

        const testDate = new Date(2026, 9, 25); // 25 Oct 2026
        component.onDateChange({ value: testDate } as any);

        expect(emitted).toEqual(['2026-10-25']);
    });

    it('should emit empty string on clearDate', () => {
        fixture.componentRef.setInput('value', '2026-08-17');
        fixture.detectChanges();

        const emitted: string[] = [];
        component.valueChange.subscribe((v) => emitted.push(v));

        component.clearDate();
        expect(emitted).toEqual(['']);
    });
});
