import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClockTimePickerComponent } from './clock-time-picker.component';

describe('ClockTimePickerComponent', () => {
    let component: ClockTimePickerComponent;
    let fixture: ComponentFixture<ClockTimePickerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ClockTimePickerComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ClockTimePickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should parse 24h input time correctly on init', () => {
        component.value = '14:35';
        component.ngOnInit();

        expect(component.hour).toBe(2);
        expect(component.minute).toBe(35);
        expect(component.period).toBe('PM');
        expect(component.hourLabel).toBe('02');
        expect(component.minuteLabel).toBe('35');
    });

    it('should parse midnight (00:00) as 12:00 AM', () => {
        component.value = '00:00';
        component.ngOnInit();

        expect(component.hour).toBe(12);
        expect(component.minute).toBe(0);
        expect(component.period).toBe('AM');
    });

    it('should parse noon (12:00) as 12:00 PM', () => {
        component.value = '12:00';
        component.ngOnInit();

        expect(component.hour).toBe(12);
        expect(component.minute).toBe(0);
        expect(component.period).toBe('PM');
    });

    it('should apply quick presets correctly', () => {
        const morning = component.presets.find((p) => p.label === 'Morning')!;
        component.applyPreset(morning);

        expect(component.hour).toBe(9);
        expect(component.minute).toBe(0);
        expect(component.period).toBe('AM');
        expect(component.isPresetActive(morning)).toBeTrue();
    });

    it('should increment and decrement hours and minutes with steppers', () => {
        component.hour = 11;
        component.minute = 59;

        component.incrementHour();
        expect(component.hour).toBe(12);

        component.incrementMinute();
        expect(component.minute).toBe(0);

        component.decrementMinute();
        expect(component.minute).toBe(59);
    });

    it('should emit 24-hour formatted time upon confirmation', () => {
        spyOn(component.selected, 'emit');
        spyOn(component.closed, 'emit');

        component.hour = 2;
        component.minute = 45;
        component.period = 'PM';

        component.confirm();

        expect(component.selected.emit).toHaveBeenCalledWith('14:45');
        expect(component.closed.emit).toHaveBeenCalled();
    });

    it('should emit midnight as 00:xx in 24h format', () => {
        spyOn(component.selected, 'emit');

        component.hour = 12;
        component.minute = 15;
        component.period = 'AM';

        component.confirm();

        expect(component.selected.emit).toHaveBeenCalledWith('00:15');
    });

    it('should set current time when setNow is invoked', () => {
        component.setNow();
        expect(component.hour).toBeGreaterThanOrEqual(1);
        expect(component.hour).toBeLessThanOrEqual(12);
        expect(component.minute).toBeGreaterThanOrEqual(0);
        expect(component.minute).toBeLessThanOrEqual(59);
        expect(['AM', 'PM']).toContain(component.period);
    });
});
