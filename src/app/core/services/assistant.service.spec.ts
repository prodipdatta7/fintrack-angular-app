import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AssistantService } from './assistant.service';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';

describe('AssistantService', () => {
    let service: AssistantService;
    let httpMock: HttpTestingController;
    let toastMock: jasmine.SpyObj<ToastService>;

    beforeEach(() => {
        localStorage.clear();
        toastMock = jasmine.createSpyObj('ToastService', ['show', 'error']);

        TestBed.configureTestingModule({
            providers: [
                AssistantService,
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ToastService, useValue: toastMock },
            ],
        });

        service = TestBed.inject(AssistantService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        localStorage.clear();
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
        expect(service.isOpen()).toBeFalse();
    });

    it('should toggle open state and load conversations', () => {
        service.toggleOpen(true);
        expect(service.isOpen()).toBeTrue();

        const req = httpMock.expectOne(`${environment.apiUrl}/Assistant/GetConversations?page=1&pageSize=30`);
        req.flush({
            items: [
                { id: 'c-1', title: 'Test Conv', isPinned: false, createdAt: '', lastMessageAt: '', messageCount: 1 },
            ],
            totalCount: 1,
            page: 1,
            pageSize: 30,
        });

        const detailReq = httpMock.expectOne(`${environment.apiUrl}/Assistant/GetConversation/c-1`);
        detailReq.flush({
            id: 'c-1',
            title: 'Test Conv',
            isPinned: false,
            createdAt: '',
            lastMessageAt: '',
            messages: [],
        });

        expect(service.activeConversation()?.id).toBe('c-1');
    });

    it('should get conversations from backend', () => {
        service.getConversations().subscribe((res) => {
            expect(res.items.length).toBe(1);
            expect(res.items[0].title).toBe('Test Conv');
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/Assistant/GetConversations?page=1&pageSize=30`);
        expect(req.request.method).toBe('GET');
        req.flush({
            items: [{ id: 'c-1', title: 'Test Conv', isPinned: false, createdAt: '', lastMessageAt: '', messageCount: 2 }],
            totalCount: 1,
            page: 1,
            pageSize: 30,
        });

        expect(service.conversations().length).toBe(1);
    });

    it('should manage permission modal and resolution and cache consent', async () => {
        const promise = service.promptPermission('camera');
        expect(service.permissionModalVisible()).toBeTrue();
        expect(service.pendingPermissionType()).toBe('camera');

        service.resolvePermission(true);
        const result = await promise;
        expect(result).toBeTrue();
        expect(service.permissionModalVisible()).toBeFalse();
        expect(service.hasConsent('camera')).toBeTrue();

        // Subsequent prompt should immediately resolve true without modal
        const cachedResult = await service.promptPermission('camera');
        expect(cachedResult).toBeTrue();
        expect(service.permissionModalVisible()).toBeFalse();
    });

    it('should toggle mute state and show toast', () => {
        expect(service.isMuted()).toBeFalse();
        service.toggleMute();
        expect(service.isMuted()).toBeTrue();
        expect(toastMock.show).toHaveBeenCalledWith('Assistant voice muted.', 'info');
    });

    it('should toggle pin on conversation', () => {
        service.conversations.set([
            { id: 'c-1', title: 'Test Conv', isPinned: false, createdAt: '', lastMessageAt: '', messageCount: 1 },
        ]);

        service.togglePinConversation('c-1').subscribe((res) => {
            expect(res).toBeTrue();
            expect(service.conversations()[0].isPinned).toBeTrue();
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/Assistant/TogglePinConversation/c-1`);
        expect(req.request.method).toBe('PATCH');
        req.flush({ isPinned: true });
    });

    it('should process voice turn and update messages', () => {
        service.processVoiceTurn('c-1', 'What is my balance?').subscribe((res) => {
            expect(res?.assistantReply).toBe('Your balance is ৳50,000');
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/Assistant/ProcessVoiceTurn`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body.transcript).toBe('What is my balance?');
        req.flush({
            messageId: 'msg-2',
            conversationId: 'c-1',
            userTranscript: 'What is my balance?',
            assistantReply: 'Your balance is ৳50,000',
        });

        expect(service.messages().length).toBe(2);
        expect(service.messages()[1].content).toBe('Your balance is ৳50,000');
    });

    it('should modify account of active proposed transaction on follow-up voice/text command', () => {
        service.messages.set([
            {
                id: 'm-1',
                conversationId: 'c-1',
                role: 'assistant',
                content: 'Prepared transaction',
                actionType: 'AddTransaction',
                actionStatus: 'Proposed',
                actionSummary: 'Add ৳55 Expense under Food & Dining from Bank Account',
                actionPayloadJson: JSON.stringify({
                    amount: 55,
                    categoryName: 'Food & Dining',
                    accountName: 'Bank Account',
                    title: 'Food & Dining',
                    type: 'Expense',
                }),
                createdAt: new Date().toISOString(),
            },
        ]);

        service.processTurn('c-1', 'it would be from Cash');

        // 1. User message save
        const msgReq = httpMock.expectOne(`${environment.apiUrl}/Assistant/SendMessage`);
        expect(msgReq.request.method).toBe('POST');
        msgReq.flush({
            id: 'm-user',
            conversationId: 'c-1',
            role: 'user',
            content: 'it would be from Cash',
            createdAt: new Date().toISOString(),
        });

        // 2. ProposeCreateTransaction call with updated account
        const propReq = httpMock.expectOne(`${environment.apiUrl}/Assistant/ProposeCreateTransaction`);
        expect(propReq.request.method).toBe('POST');
        expect(propReq.request.body.account).toBe('Cash');
        expect(propReq.request.body.amount).toBe(55);
        expect(propReq.request.body.category).toBe('Food & Dining');
        propReq.flush({
            actionType: 'AddTransaction',
            status: 'Proposed',
            summary: 'Add ৳55 Expense under Food & Dining from account Cash',
            payload: {
                amount: 55,
                categoryName: 'Food & Dining',
                accountName: 'Cash',
                title: 'Food & Dining',
                type: 'Expense',
            },
        });

        // 3. Assistant response message save
        const replyReq = httpMock.expectOne(`${environment.apiUrl}/Assistant/SendMessage`);
        expect(replyReq.request.method).toBe('POST');
        expect(replyReq.request.body.actionStatus).toBe('Proposed');
        replyReq.flush({
            id: 'm-assistant-updated',
            conversationId: 'c-1',
            role: 'assistant',
            content: "I've updated the transaction: Add ৳55 Expense under Food & Dining from account Cash. Please confirm below to record it.",
            actionType: 'AddTransaction',
            actionStatus: 'Proposed',
            actionSummary: 'Add ৳55 Expense under Food & Dining from account Cash',
            createdAt: new Date().toISOString(),
        });
    });

    it('should dispatch Income transaction with type Income', () => {
        service.activeConversation.set({
            id: 'c-1',
            title: 'Test',
            isPinned: false,
            createdAt: '',
            lastMessageAt: '',
            messageCount: 0,
        });

        service.processTurn('c-1', 'received salary of 50000 into Bank Account');

        const msgReq = httpMock.expectOne(`${environment.apiUrl}/Assistant/SendMessage`);
        msgReq.flush({
            id: 'm-u1',
            conversationId: 'c-1',
            role: 'user',
            content: 'received salary of 50000 into Bank Account',
            createdAt: new Date().toISOString(),
        });

        const propReq = httpMock.expectOne(`${environment.apiUrl}/Assistant/ProposeCreateTransaction`);
        expect(propReq.request.method).toBe('POST');
        expect(propReq.request.body.type).toBe('Income');
        expect(propReq.request.body.amount).toBe(50000);
        expect(propReq.request.body.account).toBe('Bank Account');
        propReq.flush({
            actionType: 'AddTransaction',
            status: 'Proposed',
            summary: 'Add ৳50,000 income to Bank Account',
            payload: {
                amount: 50000,
                type: 'Income',
                categoryName: 'Salary',
                accountName: 'Bank Account',
                title: 'Salary',
            },
        });

        const replyReq = httpMock.expectOne(`${environment.apiUrl}/Assistant/SendMessage`);
        expect(replyReq.request.body.actionType).toBe('AddTransaction');
        replyReq.flush({
            id: 'm-a1',
            conversationId: 'c-1',
            role: 'assistant',
            content: 'Add ৳50,000 income to Bank Account',
            createdAt: new Date().toISOString(),
        });
    });

    it('should dispatch TransferFunds when user asks to transfer between accounts', () => {
        service.activeConversation.set({
            id: 'c-1',
            title: 'Test',
            isPinned: false,
            createdAt: '',
            lastMessageAt: '',
            messageCount: 0,
        });

        service.processTurn('c-1', 'transfer 5000 from Bank Account to bKash');

        const msgReq = httpMock.expectOne(`${environment.apiUrl}/Assistant/SendMessage`);
        msgReq.flush({
            id: 'm-u2',
            conversationId: 'c-1',
            role: 'user',
            content: 'transfer 5000 from Bank Account to bKash',
            createdAt: new Date().toISOString(),
        });

        const propReq = httpMock.expectOne(`${environment.apiUrl}/Assistant/ProposeTransfer`);
        expect(propReq.request.method).toBe('POST');
        expect(propReq.request.body.amount).toBe(5000);
        expect(propReq.request.body.fromAccount).toBe('Bank Account');
        expect(propReq.request.body.toAccount).toBe('bKash');
        propReq.flush({
            actionType: 'TransferFunds',
            status: 'Proposed',
            summary: 'Transfer ৳5,000 from account "Bank Account" to "bKash"',
            payload: {
                amount: 5000,
                fromAccountName: 'Bank Account',
                toAccountName: 'bKash',
            },
        });

        const replyReq = httpMock.expectOne(`${environment.apiUrl}/Assistant/SendMessage`);
        expect(replyReq.request.body.actionType).toBe('TransferFunds');
        replyReq.flush({
            id: 'm-a2',
            conversationId: 'c-1',
            role: 'assistant',
            content: 'Transfer ৳5,000 from account "Bank Account" to "bKash"',
            createdAt: new Date().toISOString(),
        });
    });
});
