import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AssistantChatComponent } from './assistant-chat.component';
import { AssistantService } from '../../../../core/services/assistant.service';

describe('AssistantChatComponent', () => {
    let component: AssistantChatComponent;
    let fixture: ComponentFixture<AssistantChatComponent>;
    let assistantService: AssistantService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AssistantChatComponent],
            providers: [AssistantService, provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(AssistantChatComponent);
        component = fixture.componentInstance;
        assistantService = TestBed.inject(AssistantService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should send suggestion on click', () => {
        spyOn(assistantService, 'sendMessage');
        component.sendSuggestion("What's my total balance?");
        expect(assistantService.sendMessage).toHaveBeenCalledWith("What's my total balance?");
    });

    it('should speak message on speakMessage call', () => {
        spyOn(assistantService, 'speakText');
        const mockEvent = new MouseEvent('click');
        component.speakMessage('Your balance is ৳50,000', mockEvent);
        expect(assistantService.speakText).toHaveBeenCalledWith('Your balance is ৳50,000');
    });
});
