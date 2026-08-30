import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AssistantInputBarComponent } from './assistant-input-bar.component';
import { AssistantService } from '../../../../core/services/assistant.service';

describe('AssistantInputBarComponent', () => {
    let component: AssistantInputBarComponent;
    let fixture: ComponentFixture<AssistantInputBarComponent>;
    let assistantService: AssistantService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AssistantInputBarComponent],
            providers: [AssistantService, provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(AssistantInputBarComponent);
        component = fixture.componentInstance;
        assistantService = TestBed.inject(AssistantService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should submit message and clear user input', () => {
        spyOn(assistantService, 'sendMessage');
        component.userInput.set('Hello FinTrack');
        component.onSubmit();
        expect(assistantService.sendMessage).toHaveBeenCalledWith('Hello FinTrack');
        expect(component.userInput()).toBe('');
    });

    it('should toggle voice recording on voice button click', async () => {
        spyOn(assistantService, 'promptPermission').and.returnValue(Promise.resolve(true));
        spyOn(assistantService, 'startVoiceRecognition').and.returnValue(Promise.resolve(true));

        await component.onVoiceToggle();

        expect(assistantService.promptPermission).toHaveBeenCalledWith('microphone');
        expect(assistantService.startVoiceRecognition).toHaveBeenCalled();
    });
});
