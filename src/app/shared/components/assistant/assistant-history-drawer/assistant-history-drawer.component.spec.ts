import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AssistantHistoryDrawerComponent } from './assistant-history-drawer.component';
import { AssistantService } from '../../../../core/services/assistant.service';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';

describe('AssistantHistoryDrawerComponent', () => {
    let component: AssistantHistoryDrawerComponent;
    let fixture: ComponentFixture<AssistantHistoryDrawerComponent>;
    let assistantService: AssistantService;
    let httpMock: HttpTestingController;
    let toastMock: jasmine.SpyObj<ToastService>;

    beforeEach(async () => {
        localStorage.clear();
        toastMock = jasmine.createSpyObj('ToastService', ['show', 'error']);

        await TestBed.configureTestingModule({
            imports: [AssistantHistoryDrawerComponent],
            providers: [
                AssistantService,
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ToastService, useValue: toastMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AssistantHistoryDrawerComponent);
        component = fixture.componentInstance;
        assistantService = TestBed.inject(AssistantService);
        httpMock = TestBed.inject(HttpTestingController);
        fixture.detectChanges();
    });

    afterEach(() => {
        localStorage.clear();
        httpMock.verify();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should filter pinned and recent conversations', () => {
        assistantService.conversations.set([
            { id: 'c-1', title: 'Pinned Chat', isPinned: true, createdAt: '', lastMessageAt: '', messageCount: 3 },
            { id: 'c-2', title: 'Recent Chat', isPinned: false, createdAt: '', lastMessageAt: '', messageCount: 1 },
        ]);

        expect(component.pinnedConversations().length).toBe(1);
        expect(component.pinnedConversations()[0].id).toBe('c-1');
        expect(component.recentConversations().length).toBe(1);
        expect(component.recentConversations()[0].id).toBe('c-2');
    });

    it('should search conversations when searchTerm changes', () => {
        component.onSearchChange('Food');
        expect(component.searchTerm()).toBe('Food');

        const req = httpMock.expectOne(`${environment.apiUrl}/Assistant/GetConversations?page=1&pageSize=30&searchTerm=Food`);
        expect(req.request.method).toBe('GET');
        req.flush({ items: [], totalCount: 0, page: 1, pageSize: 30 });
    });

    it('should toggle pin status of a conversation', () => {
        const conv = { id: 'c-1', title: 'My Chat', isPinned: false, createdAt: '', lastMessageAt: '', messageCount: 2 };
        assistantService.conversations.set([conv]);

        const mockEvent = new MouseEvent('click');
        component.togglePin(conv, mockEvent);

        const req = httpMock.expectOne(`${environment.apiUrl}/Assistant/TogglePinConversation/c-1`);
        expect(req.request.method).toBe('PATCH');
        req.flush({ isPinned: true });

        expect(toastMock.show).toHaveBeenCalledWith('Conversation pinned to top.', 'info');
    });

    it('should start inline rename and save title', () => {
        const conv = { id: 'c-1', title: 'Old Title', isPinned: false, createdAt: '', lastMessageAt: '', messageCount: 2 };
        assistantService.conversations.set([conv]);

        const mockEvent = new MouseEvent('click');
        component.startRename(conv, mockEvent);
        expect(component.editingConversationId()).toBe('c-1');
        expect(component.editTitleInput()).toBe('Old Title');

        component.editTitleInput.set('New Name');
        component.saveRename(conv, mockEvent);

        const req = httpMock.expectOne(`${environment.apiUrl}/Assistant/UpdateConversationTitle/c-1`);
        expect(req.request.method).toBe('PATCH');
        req.flush({ title: 'New Name' });

        expect(component.editingConversationId()).toBeNull();
        expect(toastMock.show).toHaveBeenCalledWith('Conversation renamed successfully.', 'success');
    });

    it('should execute delete conversation', () => {
        const conv = { id: 'c-1', title: 'To Delete', isPinned: false, createdAt: '', lastMessageAt: '', messageCount: 2 };
        assistantService.conversations.set([conv]);

        const mockEvent = new MouseEvent('click');
        component.executeDelete(conv, mockEvent);

        const req = httpMock.expectOne(`${environment.apiUrl}/Assistant/DeleteConversation/c-1`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null);

        expect(component.deletingConversationId()).toBeNull();
        expect(toastMock.show).toHaveBeenCalledWith('Conversation deleted.', 'info');
    });
});
