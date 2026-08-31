import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobileBalanceCardComponent } from './mobile-balance-card.component';
import { CurrencyStore } from '../../../../../core/services/currency.store';

describe('MobileBalanceCardComponent', () => {
    let component: MobileBalanceCardComponent;
    let fixture: ComponentFixture<MobileBalanceCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MobileBalanceCardComponent],
            providers: [CurrencyStore],
        }).compileComponents();

        fixture = TestBed.createComponent(MobileBalanceCardComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('totalBalance', 12500);
        fixture.componentRef.setInput('totalExpense', 3200);
        fixture.componentRef.setInput('activeTimeframe', 'This Month');
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should display the balance and expense values formatted', () => {
        const host = fixture.nativeElement as HTMLElement;
        const balanceEl = host.querySelector('.balance-amount');
        const expenseEl = host.querySelector('.expense-amount');

        expect(balanceEl?.textContent).toContain('12,500');
        expect(expenseEl?.textContent).toContain('3,200');
    });

    it('should toggle timeframe dropdown menu on button click', () => {
        const toggleBtn = fixture.nativeElement.querySelector('.timeframe-toggle-btn') as HTMLButtonElement;
        expect(component.isTimeframeMenuOpen()).toBeFalse();

        toggleBtn.click();
        fixture.detectChanges();
        expect(component.isTimeframeMenuOpen()).toBeTrue();
        expect(fixture.nativeElement.querySelector('.timeframe-popover')).toBeTruthy();

        toggleBtn.click();
        fixture.detectChanges();
        expect(component.isTimeframeMenuOpen()).toBeFalse();
    });

    it('should emit timeframeChange when a preset timeframe is selected', () => {
        spyOn(component.timeframeChange, 'emit');
        component.isTimeframeMenuOpen.set(true);
        fixture.detectChanges();

        const tfButtons = fixture.nativeElement.querySelectorAll('.tf-btn') as NodeListOf<HTMLButtonElement>;
        const sevenDaysBtn = Array.from(tfButtons).find((b) => b.textContent?.trim() === '7D');
        expect(sevenDaysBtn).toBeTruthy();

        sevenDaysBtn?.click();
        expect(component.timeframeChange.emit).toHaveBeenCalledWith('7D');
        expect(component.isTimeframeMenuOpen()).toBeFalse();
    });

    it('should close popover on escape key', () => {
        component.isTimeframeMenuOpen.set(true);
        fixture.detectChanges();

        component.onEscape();
        expect(component.isTimeframeMenuOpen()).toBeFalse();
    });
});
