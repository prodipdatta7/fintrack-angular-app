import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AssistantDrawerComponent } from './assistant-drawer.component';
import { AssistantService } from '../../../../core/services/assistant.service';

describe('AssistantDrawerComponent', () => {
    let component: AssistantDrawerComponent;
    let fixture: ComponentFixture<AssistantDrawerComponent>;
    let assistantService: AssistantService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AssistantDrawerComponent],
            providers: [AssistantService, provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(AssistantDrawerComponent);
        component = fixture.componentInstance;
        assistantService = TestBed.inject(AssistantService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle assistant open state', () => {
        spyOn(assistantService, 'toggleOpen');
        component.toggle();
        expect(assistantService.toggleOpen).toHaveBeenCalled();
    });

    it('should start new chat on newChat call', () => {
        spyOn(assistantService, 'startNewConversation');
        component.newChat();
        expect(assistantService.startNewConversation).toHaveBeenCalled();
    });

    it('should close history on Escape when history is open', () => {
        assistantService.isOpen.set(true);
        assistantService.isHistoryOpen.set(true);
        spyOn(assistantService, 'toggleHistory');

        component.handleEscapeKey();
        expect(assistantService.toggleHistory).toHaveBeenCalledWith(false);
    });

    it('should close drawer on Escape when drawer is open', () => {
        assistantService.isOpen.set(true);
        assistantService.isHistoryOpen.set(false);
        spyOn(component, 'close');

        component.handleEscapeKey();
        expect(component.close).toHaveBeenCalled();
    });
});
