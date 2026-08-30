import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssistantActionCardComponent } from './assistant-action-card.component';
import { AssistantMessage } from '../../../../core/models/assistant.model';

describe('AssistantActionCardComponent', () => {
    let component: AssistantActionCardComponent;
    let fixture: ComponentFixture<AssistantActionCardComponent>;

    const mockMessage: AssistantMessage = {
        id: 'msg-1',
        conversationId: 'c-1',
        role: 'assistant',
        content: 'Proposed action',
        actionType: 'AddTransaction',
        actionStatus: 'Proposed',
        actionSummary: 'Add ৳500 for Food',
        actionPayloadJson: JSON.stringify({
            amount: 500,
            title: 'Lunch',
            categoryName: 'Food & Dining',
            accountName: 'Cash',
            date: '2026-08-19T00:00:00Z',
        }),
        createdAt: '2026-08-19T10:00:00Z',
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AssistantActionCardComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(AssistantActionCardComponent);
        component = fixture.componentInstance;
        component.message = mockMessage;
        fixture.detectChanges();
    });

    it('should create and parse action payload', () => {
        expect(component).toBeTruthy();
        expect(component.parsedPayload()?.amount).toBe(500);
        expect(component.parsedPayload()?.categoryName).toBe('Food & Dining');
    });

    it('should emit confirm event on confirm click', () => {
        spyOn(component.confirm, 'emit');
        component.onConfirm();
        expect(component.confirm.emit).toHaveBeenCalledWith(mockMessage);
    });

    it('should emit cancel event on cancel click', () => {
        spyOn(component.cancel, 'emit');
        component.onCancel();
        expect(component.cancel.emit).toHaveBeenCalledWith(mockMessage);
    });
});
