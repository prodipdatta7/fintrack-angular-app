import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map, switchMap, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    AssistantConversation,
    AssistantMessage,
    ConversationDetail,
    ConversationListResult,
    ProposedAction,
    ProposedCreateTransactionPayload,
    ProposedTransferPayload,
    ProposedCreateAccountPayload,
    ProposedCreateCategoryPayload,
    ProposedCreateTagPayload,
    ProposedCreateSavingsPlanPayload,
    VoiceTurnResult,
} from '../models/assistant.model';
import { TransactionService } from './transaction.service';
import { AccountService } from './account.service';
import { CategoryService } from './category.service';
import { TagService } from './tag.service';
import { PlanService } from './plan.service';
import { ToastService } from './toast.service';

@Injectable({
    providedIn: 'root',
})
export class AssistantService {
    private readonly http = inject(HttpClient);
    private readonly transactionService = inject(TransactionService);
    private readonly accountService = inject(AccountService);
    private readonly categoryService = inject(CategoryService);
    private readonly tagService = inject(TagService);
    private readonly planService = inject(PlanService);
    private readonly toast = inject(ToastService);

    private readonly apiUrl = environment.apiUrl;

    // UI State Signals
    readonly isOpen = signal<boolean>(false);
    readonly isHistoryOpen = signal<boolean>(false);
    readonly conversations = signal<AssistantConversation[]>([]);
    readonly activeConversation = signal<AssistantConversation | null>(null);
    readonly messages = signal<AssistantMessage[]>([]);
    readonly isLoading = signal<boolean>(false);
    readonly isProcessing = signal<boolean>(false);
    readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.isOnline.set(true);
                this.toast.show('Internet connection restored.', 'info');
            });
            window.addEventListener('offline', () => {
                this.isOnline.set(false);
                this.toast.show('You are currently offline.', 'error');
            });
        }
    }

    // Permission / Consent Modal State
    readonly permissionModalVisible = signal<boolean>(false);
    readonly pendingPermissionType = signal<'microphone' | 'camera' | null>(null);
    private permissionResolver: ((granted: boolean) => void) | null = null;

    // Voice State Signals
    readonly voiceState = signal<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
    readonly interimTranscript = signal<string>('');
    readonly isMuted = signal<boolean>(false);
    readonly audioLevel = signal<number>(0);

    private recognitionInstance: any = null;
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private analyser: AnalyserNode | null = null;
    private animFrameId: number | null = null;

    toggleMute(): void {
        const next = !this.isMuted();
        this.isMuted.set(next);
        if (next && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            if (this.voiceState() === 'speaking') {
                this.voiceState.set('idle');
            }
        }
        this.toast.show(next ? 'Assistant voice muted.' : 'Assistant voice unmuted.', 'info');
    }

    speakText(text: string): void {
        if (this.isMuted() || !('speechSynthesis' in window)) return;

        try {
            window.speechSynthesis.cancel();

            // Clean markdown tokens for clear speech
            const cleanText = text
                .replace(/[#*_`~]/g, '')
                .replace(/৳/g, 'Taka ')
                .replace(/\n+/g, '. ')
                .trim();

            if (!cleanText) return;

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            utterance.onstart = () => {
                this.voiceState.set('speaking');
            };

            utterance.onend = () => {
                if (this.voiceState() === 'speaking') {
                    this.voiceState.set('idle');
                }
            };

            utterance.onerror = () => {
                if (this.voiceState() === 'speaking') {
                    this.voiceState.set('idle');
                }
            };

            window.speechSynthesis.speak(utterance);
        } catch (err) {
            console.warn('[Assistant TTS] Speech synthesis error:', err);
            this.voiceState.set('idle');
        }
    }

    startVoiceRecognition(onTranscript?: (text: string, isFinal: boolean) => void): Promise<boolean> {
        const SpeechRec =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition ||
            (window as any).mozSpeechRecognition ||
            (window as any).msSpeechRecognition;

        if (!SpeechRec) {
            this.toast.show('Speech recognition is not supported in this browser. Please use Chrome or Edge.', 'error');
            this.voiceState.set('idle');
            return Promise.resolve(false);
        }

        return new Promise<boolean>((resolve) => {
            try {
                this.stopVoiceRecognition();

                const recognition = new SpeechRec();
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onstart = () => {
                    this.voiceState.set('listening');
                    this.interimTranscript.set('');
                    this.startAudioVisualizer();
                    resolve(true);
                };

                recognition.onresult = (event: any) => {
                    let interim = '';
                    let final = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            final += event.results[i][0].transcript;
                        } else {
                            interim += event.results[i][0].transcript;
                        }
                    }

                    const current = (final || interim).trim();
                    this.interimTranscript.set(current);
                    if (onTranscript && current) {
                        onTranscript(current, !!final);
                    }
                };

                recognition.onerror = (err: any) => {
                    console.warn('[Assistant Voice] Speech recognition error:', err.error);
                    this.stopAudioVisualizer();
                    this.voiceState.set('idle');
                    if (err.error === 'not-allowed') {
                        this.toast.show('Microphone access was blocked in your browser settings.', 'error');
                    }
                };

                recognition.onend = () => {
                    this.stopAudioVisualizer();
                    const transcript = this.interimTranscript().trim();
                    this.interimTranscript.set('');

                    if (transcript) {
                        const active = this.activeConversation();
                        if (active) {
                            this.processVoiceTurn(active.id, transcript).subscribe();
                        } else {
                            this.startNewConversation(transcript);
                        }
                    } else {
                        this.voiceState.set('idle');
                    }
                };

                this.recognitionInstance = recognition;
                recognition.start();
            } catch (err) {
                console.error('[Assistant Voice] Failed to start speech recognition:', err);
                this.stopAudioVisualizer();
                this.voiceState.set('idle');
                resolve(false);
            }
        });
    }

    stopVoiceRecognition(): void {
        this.stopAudioVisualizer();
        if (this.recognitionInstance) {
            try {
                this.recognitionInstance.stop();
            } catch {}
            this.recognitionInstance = null;
        }
        if (this.voiceState() === 'listening') {
            this.voiceState.set('idle');
        }
    }

    processVoiceTurn(conversationId: string, transcript: string): Observable<VoiceTurnResult | null> {
        this.voiceState.set('processing');
        this.isProcessing.set(true);

        const tempUserMsg: AssistantMessage = {
            id: `client-${Date.now()}`,
            conversationId,
            role: 'user',
            content: transcript,
            createdAt: new Date().toISOString(),
        };
        this.messages.update((list) => [...list, tempUserMsg]);

        return this.http
            .post<VoiceTurnResult>(`${this.apiUrl}/Assistant/ProcessVoiceTurn`, {
                conversationId,
                transcript,
                enableTts: !this.isMuted(),
            })
            .pipe(
                tap((res) => {
                    const assistantMsg: AssistantMessage = {
                        id: res.messageId,
                        conversationId: res.conversationId,
                        role: 'assistant',
                        content: res.assistantReply,
                        actionType: res.actionType,
                        actionStatus: res.actionStatus as any,
                        actionSummary: res.actionSummary,
                        actionPayloadJson: res.actionPayloadJson,
                        createdAt: new Date().toISOString(),
                    };
                    this.messages.update((list) => [...list, assistantMsg]);
                    this.isProcessing.set(false);
                    this.voiceState.set('idle');
                    this.speakText(res.assistantReply);
                }),
                catchError(() => {
                    // Fallback to client-side NLP tool dispatch with TTS read-aloud
                    return this.dispatchNlp(conversationId, transcript).pipe(
                        map((assistantMsg) => {
                            if (!assistantMsg) return null;
                            this.messages.update((list) => [...list, assistantMsg]);
                            this.speakText(assistantMsg.content);
                            const voiceRes: VoiceTurnResult = {
                                messageId: assistantMsg.id,
                                conversationId: assistantMsg.conversationId,
                                userTranscript: transcript,
                                assistantReply: assistantMsg.content,
                                actionType: assistantMsg.actionType,
                                actionStatus: assistantMsg.actionStatus,
                                actionSummary: assistantMsg.actionSummary,
                                actionPayloadJson: assistantMsg.actionPayloadJson,
                            };
                            return voiceRes;
                        }),
                        tap(() => {
                            this.isProcessing.set(false);
                            this.voiceState.set('idle');
                        }),
                        catchError(() => {
                            this.isProcessing.set(false);
                            this.voiceState.set('idle');
                            this.toast.error('Failed to process voice command.');
                            return of(null);
                        }),
                    );
                }),
            );
    }

    private startAudioVisualizer(): void {
        if (!navigator.mediaDevices?.getUserMedia) return;

        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                this.mediaStream = stream;
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioCtx) return;

                this.audioContext = new AudioCtx();
                const source = this.audioContext.createMediaStreamSource(stream);
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 64;
                source.connect(this.analyser);

                const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                const sample = () => {
                    if (!this.analyser || this.voiceState() !== 'listening') return;
                    this.analyser.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const avg = sum / dataArray.length;
                    const level = Math.min(100, Math.round((avg / 128) * 100));
                    this.audioLevel.set(level);
                    this.animFrameId = requestAnimationFrame(sample);
                };
                sample();
            })
            .catch(() => {
                // Audio visualizer is a visual enhancement; silent fallback if stream capture fails
            });
    }

    private stopAudioVisualizer(): void {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((t) => t.stop());
            this.mediaStream = null;
        }
        if (this.audioContext) {
            try {
                this.audioContext.close();
            } catch {}
            this.audioContext = null;
        }
        this.analyser = null;
        this.audioLevel.set(0);
    }

    toggleOpen(state?: boolean): void {
        const next = state !== undefined ? state : !this.isOpen();
        this.isOpen.set(next);
        if (next && !this.activeConversation()) {
            this.loadInitialConversation();
        }
    }

    toggleHistory(state?: boolean): void {
        this.isHistoryOpen.set(state !== undefined ? state : !this.isHistoryOpen());
        if (this.isHistoryOpen()) {
            this.getConversations().subscribe();
        }
    }

    loadInitialConversation(): void {
        this.getConversations().subscribe((res) => {
            if (res.items.length > 0) {
                this.selectConversation(res.items[0].id);
            } else {
                this.startNewConversation();
            }
        });
    }

    getConversations(searchTerm?: string, page = 1, pageSize = 30): Observable<ConversationListResult> {
        this.isLoading.set(true);
        const params: any = { page: page.toString(), pageSize: pageSize.toString() };
        if (searchTerm && searchTerm.trim()) {
            params.searchTerm = searchTerm.trim();
        }
        return this.http
            .get<ConversationListResult>(`${this.apiUrl}/Assistant/GetConversations`, { params })
            .pipe(
                tap((res) => {
                    this.conversations.set(res.items);
                    this.isLoading.set(false);
                }),
                catchError(() => {
                    this.isLoading.set(false);
                    return of({ items: [], totalCount: 0, page: 1, pageSize: 30 });
                }),
            );
    }

    selectConversation(conversationId: string): void {
        this.isLoading.set(true);
        this.http
            .get<ConversationDetail>(`${this.apiUrl}/Assistant/GetConversation/${conversationId}`)
            .pipe(
                tap((detail) => {
                    this.activeConversation.set({
                        id: detail.id,
                        title: detail.title,
                        isPinned: detail.isPinned,
                        createdAt: detail.createdAt,
                        lastMessageAt: detail.lastMessageAt,
                        messageCount: detail.messages.length,
                    });
                    this.messages.set(detail.messages);
                    this.isLoading.set(false);
                    this.isHistoryOpen.set(false);
                }),
                catchError(() => {
                    this.isLoading.set(false);
                    this.toast.error('Failed to load conversation history.');
                    return of(null);
                }),
            )
            .subscribe();
    }

    startNewConversation(initialPrompt?: string): void {
        this.isLoading.set(true);
        this.http
            .post<AssistantConversation>(`${this.apiUrl}/Assistant/CreateConversation`, {
                initialMessage: initialPrompt ?? null,
            })
            .pipe(
                tap((conv) => {
                    this.activeConversation.set(conv);
                    this.conversations.update((list) => [conv, ...list.filter((c) => c.id !== conv.id)]);
                    if (initialPrompt) {
                        this.messages.set([
                            {
                                id: 'temp-1',
                                conversationId: conv.id,
                                role: 'user',
                                content: initialPrompt,
                                createdAt: new Date().toISOString(),
                            },
                        ]);
                        this.processTurn(conv.id, initialPrompt);
                    } else {
                        this.messages.set([]);
                    }
                    this.isLoading.set(false);
                    this.isHistoryOpen.set(false);
                }),
                catchError(() => {
                    this.isLoading.set(false);
                    this.toast.error('Failed to create new conversation.');
                    return of(null);
                }),
            )
            .subscribe();
    }

    sendMessage(content: string): void {
        const active = this.activeConversation();
        if (!active) {
            this.startNewConversation(content);
            return;
        }

        const userMsg: AssistantMessage = {
            id: `client-${Date.now()}`,
            conversationId: active.id,
            role: 'user',
            content: content.trim(),
            createdAt: new Date().toISOString(),
        };

        this.messages.update((list) => [...list, userMsg]);
        this.processTurn(active.id, content);
    }

    processTurn(conversationId: string, content: string): void {
        this.isProcessing.set(true);

        this.http
            .post<AssistantMessage>(`${this.apiUrl}/Assistant/SendMessage`, {
                conversationId,
                content,
                role: 'user',
            })
            .pipe(
                switchMap(() => {
                    return this.dispatchNlp(conversationId, content);
                }),
                tap((assistantMsg) => {
                    if (assistantMsg) {
                        this.messages.update((list) => [...list, assistantMsg]);
                    }
                    this.isProcessing.set(false);
                }),
                catchError(() => {
                    this.isProcessing.set(false);
                    const errorMsg: AssistantMessage = {
                        id: `err-${Date.now()}`,
                        conversationId,
                        role: 'assistant',
                        content: 'Sorry, I encountered an issue processing your request. Please try again.',
                        createdAt: new Date().toISOString(),
                    };
                    this.messages.update((list) => [...list, errorMsg]);
                    return of(null);
                }),
            )
            .subscribe();
    }

    private dispatchNlp(conversationId: string, content: string): Observable<AssistantMessage | null> {
        const lower = content.toLowerCase().trim();

        // 1. Check for Multi-Turn Follow-Ups on Active Proposed Action
        const activeProposed = this.messages()
            .slice()
            .reverse()
            .find((m) => m.actionStatus === 'Proposed' && m.actionType === 'AddTransaction');

        if (activeProposed && this.isMultiTurnFollowUp(lower)) {
            if (/^(?:yes|confirm|record|save|do it|go ahead|proceed|sure|ok|okay)(?:\s+(?:please|it|now))?$/i.test(lower)) {
                this.confirmProposedAction(activeProposed);
                return this.saveAssistantTurn(conversationId, 'Transaction confirmed and recorded successfully!');
            }

            if (/^(?:no|cancel|discard|nevermind|don't|stop)(?:\s+(?:it|that|please))?$/i.test(lower)) {
                this.cancelProposedAction(activeProposed);
                return this.saveAssistantTurn(conversationId, 'Proposed transaction was cancelled.');
            }

            // Follow-up modification (Account, Amount, Category)
            let existingPayload: ProposedCreateTransactionPayload | null = null;
            if (activeProposed.actionPayloadJson) {
                try {
                    existingPayload = JSON.parse(activeProposed.actionPayloadJson);
                } catch {}
            }

            const extractedAccount = this.extractAccountName(content) ?? existingPayload?.accountName ?? 'Default Account';
            const extractedAmount = /[0-9]+/.test(content) ? this.parseAmount(content) : (existingPayload?.amount ?? 100);
            const extractedCategory = this.hasCategoryKeyword(content) ? this.parseCategory(content) : (existingPayload?.categoryName ?? 'General Expense');
            const extractedTitle = existingPayload?.title ?? extractedCategory;
            const extractedType = existingPayload?.type ?? 'Expense';

            return this.http
                .post<ProposedAction<ProposedCreateTransactionPayload>>(`${this.apiUrl}/Assistant/ProposeCreateTransaction`, {
                    amount: extractedAmount,
                    category: extractedCategory,
                    title: extractedTitle,
                    account: extractedAccount,
                    note: content,
                    type: extractedType,
                })
                .pipe(
                    switchMap((proposed) => {
                        // Update the existing proposed message in place or append update
                        return this.saveAssistantTurn(
                            conversationId,
                            `I've updated the transaction: ${proposed.summary}. Please confirm below to record it.`,
                            'AddTransaction',
                            'Proposed',
                            proposed.summary,
                            JSON.stringify(proposed.payload),
                        );
                    }),
                );
        }

        if (lower.includes('overview') || lower.includes('summary') || lower.includes('status')) {
            return forkJoin({
                balance: this.http.post<any>(`${this.apiUrl}/Assistant/GetPortfolioOrAccountBalance`, {}),
                expenses: this.http.post<any>(`${this.apiUrl}/Assistant/GetTopSpendingExpenses`, { period: 'this_month', limit: 3 }),
            }).pipe(
                switchMap(({ balance, expenses }) => {
                    const topItems = expenses.expenses || [];
                    let reply = `### 📊 Financial Overview\n\n`;
                    reply += `• **Total Portfolio Balance:** ৳${balance.totalBalance?.toLocaleString() ?? 0} (${balance.accountCount ?? 0} active accounts)\n`;
                    reply += `• **Total Spent This Month:** ৳${expenses.totalSpentInPeriod?.toLocaleString() ?? 0}\n`;
                    if (topItems.length > 0) {
                        reply += `\n**Top Expenses This Month:**\n`;
                        topItems.forEach((item: any) => {
                            reply += `• ${item.title}: ৳${item.amount?.toLocaleString()} (*${item.categoryName}*)\n`;
                        });
                    }
                    return this.saveAssistantTurn(conversationId, reply);
                }),
            );
        }

        if (lower.includes('balance') || lower.includes('how much') || lower.includes('portfolio')) {
            return this.http
                .post<any>(`${this.apiUrl}/Assistant/GetPortfolioOrAccountBalance`, {})
                .pipe(
                    switchMap((res) => {
                        const reply = `Your total active portfolio balance is **৳${res.totalBalance?.toLocaleString() ?? 0}** across ${res.accountCount ?? 0} active accounts.`;
                        return this.saveAssistantTurn(conversationId, reply);
                    }),
                );
        }

        if (lower.includes('spending') || lower.includes('expense') || lower.includes('top spending')) {
            return this.http
                .post<any>(`${this.apiUrl}/Assistant/GetTopSpendingExpenses`, { period: 'this_month', limit: 5 })
                .pipe(
                    switchMap((res) => {
                        const items = res.expenses || [];
                        let reply = `Here are your top spending expenses this month (Total: ৳${res.totalSpentInPeriod?.toLocaleString() ?? 0}):\n`;
                        if (items.length === 0) {
                            reply += `\n*No expense transactions recorded yet this month.*`;
                        } else {
                            items.forEach((item: any) => {
                                reply += `\n• **${item.title}**: ৳${item.amount?.toLocaleString()} (*${item.categoryName}*)`;
                            });
                        }
                        return this.saveAssistantTurn(conversationId, reply);
                    }),
                );
        }

        if (lower.includes('savings') || lower.includes('goal') || lower.includes('plan')) {
            return this.http
                .post<any>(`${this.apiUrl}/Assistant/GetSavingsPlansStatus`, {})
                .pipe(
                    switchMap((res) => {
                        const plans = res.plans || [];
                        let reply = `You have ${res.planCount ?? 0} active savings goals (Target: ৳${res.totalTargetAmount?.toLocaleString() ?? 0}, Saved: ৳${res.totalCurrentAmount?.toLocaleString() ?? 0}):\n`;
                        if (plans.length === 0) {
                            reply += `\n*No active savings goals found.*`;
                        } else {
                            plans.forEach((p: any) => {
                                reply += `\n• **${p.title}**: ৳${p.currentAmount?.toLocaleString()} / ৳${p.targetAmount?.toLocaleString()} (${p.progressPercentage}%)`;
                            });
                        }
                        return this.saveAssistantTurn(conversationId, reply);
                    }),
                );
        }

        const isTransfer =
            /(?:transfer|send|move|wire|shift|withdraw)\s+(?:৳|bdt|tk|\$)?\s*([0-9,]+)/i.test(content) ||
            (lower.includes('transfer') && (lower.includes('from') || lower.includes('to') || lower.includes('between')));

        if (isTransfer) {
            const amount = this.parseAmount(content);
            const { fromAccount, toAccount } = this.extractTransferAccounts(content);

            return this.http
                .post<ProposedAction<ProposedTransferPayload>>(`${this.apiUrl}/Assistant/ProposeTransfer`, {
                    amount,
                    fromAccount,
                    toAccount,
                    note: content,
                })
                .pipe(
                    switchMap((proposed) => {
                        return this.saveAssistantTurn(
                            conversationId,
                            proposed.summary,
                            'TransferFunds',
                            'Proposed',
                            proposed.summary,
                            JSON.stringify(proposed.payload),
                        );
                    }),
                );
        }

        const isTransaction =
            /(?:add|at|ad|record|log|spent|spend|buy|bought|pay|paid|cost|create|make|insert|new|got|received|deposit|earn|earned|bonus|salary|consulting|dividend|interest|grant)\s*(?:a|an)?\s*(?:transaction|expense|income|entry|salary|deposit|payment)?/i.test(content) ||
            /(?:bdt|৳|tk|dollar|\$|\bamount\b)\s*([0-9,]+)/i.test(content) ||
            /([0-9,]+)\s*(?:bdt|৳|tk|taka|bucks|dollars|\$)/i.test(content) ||
            /(?:transaction|expense|income|salary|deposit)\s*(?:of|for)?\s*([0-9]+)/i.test(content) ||
            /[0-9]+\s*(?:for|on|in|to)\s*[a-zA-Z]+/i.test(content);

        if (isTransaction) {
            const isIncome =
                /salary|income|earned|earn|deposit|bonus|freelance|wage|received|got|reimburse|cashback|dividend|interest|consulting|gift/i.test(content) ||
                /(?:add|log|record)\s+(?:an?\s+)?income/i.test(content);

            const txType = isIncome ? 'Income' : 'Expense';
            const amount = this.parseAmount(content);
            const category = this.parseCategory(content, isIncome);
            const title = this.parseTitle(content, category);
            const account = this.extractAccountName(content) ?? 'Default Account';

            return this.http
                .post<ProposedAction<ProposedCreateTransactionPayload>>(`${this.apiUrl}/Assistant/ProposeCreateTransaction`, {
                    amount,
                    category,
                    title,
                    account,
                    note: content,
                    type: txType,
                })
                .pipe(
                    switchMap((proposed) => {
                        return this.saveAssistantTurn(
                            conversationId,
                            proposed.summary,
                            'AddTransaction',
                            'Proposed',
                            proposed.summary,
                            JSON.stringify(proposed.payload),
                        );
                    }),
                );
        }

        const fallback = `I can help you review balances, check spending by category, analyze savings plans, log income & expenses, or transfer funds between accounts. What would you like to do?`;
        return this.saveAssistantTurn(conversationId, fallback);
    }

    private isMultiTurnFollowUp(lower: string): boolean {
        return (
            /^(?:yes|confirm|record|save|do it|go ahead|proceed|sure|ok|okay)(?:\s+(?:please|it|now))?$/i.test(lower) ||
            /^(?:no|cancel|discard|nevermind|don't|stop)(?:\s+(?:it|that|please))?$/i.test(lower) ||
            /(?:from|in|using|via|with|paid\s+(?:from|with|in)|account\s+(?:is|to)|change\s+account\s+to|it\s+would\s+be\s+from|from\s+account)\s+([a-zA-Z0-9\s]+)/i.test(lower) ||
            /\b(?:cash|bank|bkash|nagad|rocket|wallet|card)\b/i.test(lower) ||
            /(?:actually|change\s+amount|make\s+it|amount\s+is)\s+[0-9]+/i.test(lower) ||
            /(?:change\s+category|category\s+is)\s+[a-zA-Z]+/i.test(lower) ||
            /(?:income|expense|salary|transfer)/i.test(lower)
        );
    }

    private extractTransferAccounts(text: string): { fromAccount: string; toAccount: string } {
        const match = text.match(/(?:from\s+([a-zA-Z0-9\s]+?)\s+to\s+([a-zA-Z0-9\s]+))|(?:to\s+([a-zA-Z0-9\s]+?)\s+from\s+([a-zA-Z0-9\s]+))/i);
        if (match) {
            if (match[1] && match[2]) {
                return { fromAccount: this.cleanAccountName(match[1]), toAccount: this.cleanAccountName(match[2]) };
            }
            if (match[3] && match[4]) {
                return { fromAccount: this.cleanAccountName(match[4]), toAccount: this.cleanAccountName(match[3]) };
            }
        }

        const fromMatch = text.match(/(?:from)\s+([a-zA-Z0-9\s]+?)(?:\s*(?:to|into|please|now|$)|$)/i);
        const toMatch = text.match(/(?:to|into)\s+([a-zA-Z0-9\s]+?)(?:\s*(?:from|please|now|$)|$)/i);

        return {
            fromAccount: fromMatch ? this.cleanAccountName(fromMatch[1]) : 'Bank Account',
            toAccount: toMatch ? this.cleanAccountName(toMatch[1]) : 'Cash',
        };
    }

    private cleanAccountName(raw: string): string {
        const val = raw.trim();
        if (val.toLowerCase() === 'cash') return 'Cash';
        if (val.toLowerCase() === 'bkash') return 'bKash';
        if (val.toLowerCase() === 'nagad') return 'Nagad';
        if (val.toLowerCase() === 'rocket') return 'Rocket';
        if (val.toLowerCase() === 'bank' || val.toLowerCase() === 'bank account') return 'Bank Account';
        return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    }

    private extractAccountName(text: string): string | null {
        const match = text.match(/(?:from|in|using|via|with|paid\s+(?:from|with|in)|account\s+(?:is|to)|change\s+account\s+to|it\s+would\s+be\s+from|from\s+account|to\s+account|into\s+account)\s+([a-zA-Z0-9\s]+?)(?:\s*(?:please|instead|now|$)|$)/i);
        if (match && match[1]?.trim()) {
            return this.cleanAccountName(match[1]);
        }

        if (/\bcash\b/i.test(text)) return 'Cash';
        if (/\bbkash\b/i.test(text)) return 'bKash';
        if (/\bnagad\b/i.test(text)) return 'Nagad';
        if (/\brocket\b/i.test(text)) return 'Rocket';
        if (/\bbank\b/i.test(text)) return 'Bank Account';
        return null;
    }

    private hasCategoryKeyword(text: string): boolean {
        return /food|foot|feed|dining|lunch|dinner|breakfast|snack|transport|bill|utilities|entertainment|health|shopping|housing|education|salary|invest|freelance|bonus|gift|dividend/i.test(text);
    }

    private parseAmount(text: string): number {
        const match = text.match(/(?:bdt|৳|tk|taka|dollar|\$|\bamount\b|\bof\b|\bfor\b)?\s*([0-9]+(?:\.[0-9]{1,2})?)\s*(?:bdt|৳|tk|taka|dollar|\$)?/i);
        if (match && match[1]) {
            const num = parseFloat(match[1].replace(/,/g, ''));
            if (!isNaN(num) && num > 0) return num;
        }
        const genericNumber = text.match(/\b([0-9]+(?:\.[0-9]{1,2})?)\b/);
        if (genericNumber && genericNumber[1]) {
            const num = parseFloat(genericNumber[1]);
            if (!isNaN(num) && num > 0) return num;
        }
        return 100;
    }

    private parseCategory(text: string, isIncome = false): string {
        if (isIncome) {
            if (/freelance|upwork|fiverr|client|contract|consulting/i.test(text)) return 'Freelance';
            if (/bonus|reward|gift|presents/i.test(text)) return 'Bonus';
            if (/invest|dividend|stock|interest|profit|crypto/i.test(text)) return 'Investments';
            if (/refund|reimburse|cashback/i.test(text)) return 'Reimbursement';
            return 'Salary';
        }

        if (/food|foot|feed|dining|lunch|dinner|breakfast|snack|snacks|coffee|tea|cafe|restaurant|burger|pizza|grocery|groceries|market|fruit|vegetables|sweet|sweets/i.test(text)) return 'Food & Dining';
        if (/transport|transportation|bus|train|uber|pathao|taxi|auto|rickshaw|metro|ticket|fuel|gas|petrol|octane|diesel|cng|fare|ride/i.test(text)) return 'Transportation';
        if (/utility|utilities|bill|bills|electricity|current|gas|water|wasa|desco|internet|wifi|broadband|recharge|mobile|phone/i.test(text)) return 'Utilities';
        if (/entertainment|movie|cinema|film|netflix|spotify|game|gaming|fun|concert|theatre|outing/i.test(text)) return 'Entertainment';
        if (/health|healthcare|medical|medicine|medicines|doctor|hospital|clinic|pharmacy|drug|drugs|checkup|dentist/i.test(text)) return 'Healthcare';
        if (/shopping|dress|cloth|clothes|clothing|shirt|pants|shoe|shoes|bag|mall|daraz|amazon|store|gadget|electronics/i.test(text)) return 'Shopping';
        if (/housing|house|rent|apartment|flat|maintenance/i.test(text)) return 'Housing';
        if (/education|tuition|course|class|training|book|books|stationery|school|college|university|exam/i.test(text)) return 'Education';
        if (/salary|income|wage|paycheck|bonus|freelance|earnings/i.test(text)) return 'Salary';
        if (/invest|investment|stock|stocks|crypto|savings|deposit/i.test(text)) return 'Investments';
        return 'General Expense';
    }

    private parseTitle(text: string, category: string): string {
        const forMatch = text.match(/(?:for|on|in|from|as)\s+([a-zA-Z\s]+?)(?:\s*(?:of|at|with|to|bdt|৳|tk|\$|[0-9]|$)|$)/i);
        if (forMatch && forMatch[1]?.trim()) {
            const raw = forMatch[1].trim();
            if (raw.toLowerCase() === 'foot' || raw.toLowerCase() === 'food') return 'Food & Dining';
            return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
        }
        return category;
    }

    private saveAssistantTurn(
        conversationId: string,
        content: string,
        actionType?: string,
        actionStatus?: string,
        actionSummary?: string,
        actionPayloadJson?: string,
    ): Observable<AssistantMessage> {
        return this.http.post<AssistantMessage>(`${this.apiUrl}/Assistant/SendMessage`, {
            conversationId,
            content,
            role: 'assistant',
            actionType: actionType ?? null,
            actionStatus: actionStatus ?? null,
            actionSummary: actionSummary ?? null,
            actionPayloadJson: actionPayloadJson ?? null,
        });
    }

    extractReceipt(file: File): void {
        const active = this.activeConversation();
        if (!active) {
            this.startNewConversation('Receipt Photo Scan');
            setTimeout(() => this.extractReceipt(file), 300);
            return;
        }

        this.isProcessing.set(true);

        const reader = new FileReader();
        reader.onload = () => {
            const base64Data = (reader.result as string).split(',')[1];
            this.http
                .post<ProposedAction<ProposedCreateTransactionPayload>>(
                    `${this.apiUrl}/Assistant/ExtractTransactionFromReceipt`,
                    {
                        base64Image: base64Data,
                        contentType: file.type || 'image/jpeg',
                        fileName: file.name,
                        rawText: file.name,
                    },
                )
                .pipe(
                    switchMap((action) => {
                        return this.saveAssistantTurn(
                            active.id,
                            action.summary,
                            'AddTransaction',
                            'Proposed',
                            action.summary,
                            JSON.stringify(action.payload),
                        );
                    }),
                    tap((assistantMsg) => {
                        this.messages.update((list) => [...list, assistantMsg]);
                        this.isProcessing.set(false);
                    }),
                    catchError(() => {
                        this.isProcessing.set(false);
                        this.toast.error('Failed to extract transaction from receipt.');
                        return of(null);
                    }),
                )
                .subscribe();
        };

        reader.readAsDataURL(file);
    }

    confirmProposedAction(message: AssistantMessage): void {
        if (!message.actionPayloadJson || message.actionStatus !== 'Proposed') return;

        const payload = JSON.parse(message.actionPayloadJson);

        if (message.actionType === 'AddTransaction') {
            const isIncome = payload.type === 'Income';
            const req = {
                title: payload.title || (isIncome ? 'Income' : 'Expense'),
                amount: payload.amount,
                type: isIncome ? 1 : 2,
                categoryId: payload.categoryId || '',
                accountId: payload.accountId || '',
                date: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString(),
                note: payload.note || 'Created via FinTrack Assistant',
            };

            this.transactionService.createTransaction(req).subscribe({
                next: () => {
                    this.updateMessageStatus(message.id, 'Confirmed');
                    this.toast.show(`${isIncome ? 'Income' : 'Expense'} successfully recorded!`, 'success');
                },
                error: () => this.toast.error('Failed to record transaction.'),
            });
        } else if (message.actionType === 'TransferFunds') {
            const outReq = {
                title: `Transfer to ${payload.toAccountName || 'Account'}`,
                amount: payload.amount,
                type: 2, // Expense
                categoryId: '',
                accountId: payload.fromAccountId || '',
                date: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString(),
                note: payload.note || `Transfer to ${payload.toAccountName}`,
            };

            const inReq = {
                title: `Transfer from ${payload.fromAccountName || 'Account'}`,
                amount: payload.amount,
                type: 1, // Income
                categoryId: '',
                accountId: payload.toAccountId || '',
                date: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString(),
                note: payload.note || `Transfer from ${payload.fromAccountName}`,
            };

            forkJoin([
                this.transactionService.createTransaction(outReq),
                this.transactionService.createTransaction(inReq),
            ]).subscribe({
                next: () => {
                    this.updateMessageStatus(message.id, 'Confirmed');
                    this.toast.show(`Transfer of ৳${payload.amount.toLocaleString()} successfully recorded!`, 'success');
                },
                error: () => this.toast.error('Failed to record transfer.'),
            });
        }
    }

    cancelProposedAction(message: AssistantMessage): void {
        this.updateMessageStatus(message.id, 'Cancelled');
        this.toast.show('Proposed action was cancelled.', 'info');
    }

    private updateMessageStatus(messageId: string, status: 'Confirmed' | 'Cancelled'): void {
        this.messages.update((list) =>
            list.map((m) => (m.id === messageId ? { ...m, actionStatus: status } : m)),
        );
    }

    hasConsent(type: 'microphone' | 'camera'): boolean {
        return localStorage.getItem(`fintrack_consent_${type}`) === 'granted';
    }

    promptPermission(type: 'microphone' | 'camera'): Promise<boolean> {
        if (this.hasConsent(type)) {
            return Promise.resolve(true);
        }

        this.pendingPermissionType.set(type);
        this.permissionModalVisible.set(true);

        return new Promise<boolean>((resolve) => {
            this.permissionResolver = resolve;
        });
    }

    resolvePermission(granted: boolean): void {
        const type = this.pendingPermissionType();
        if (type && granted) {
            localStorage.setItem(`fintrack_consent_${type}`, 'granted');
        }

        this.permissionModalVisible.set(false);
        this.pendingPermissionType.set(null);
        if (this.permissionResolver) {
            this.permissionResolver(granted);
            this.permissionResolver = null;
        }
    }

    updateConversationTitle(conversationId: string, title: string): Observable<string> {
        return this.http
            .patch<{ title: string }>(`${this.apiUrl}/Assistant/UpdateConversationTitle/${conversationId}`, { title })
            .pipe(
                map((res) => res.title),
                tap((newTitle) => {
                    this.conversations.update((list) =>
                        list.map((c) => (c.id === conversationId ? { ...c, title: newTitle } : c)),
                    );
                    if (this.activeConversation()?.id === conversationId) {
                        this.activeConversation.update((c) => (c ? { ...c, title: newTitle } : null));
                    }
                }),
            );
    }

    togglePinConversation(conversationId: string): Observable<boolean> {
        return this.http
            .patch<{ isPinned: boolean }>(`${this.apiUrl}/Assistant/TogglePinConversation/${conversationId}`, {})
            .pipe(
                map((res) => res.isPinned),
                tap((newPinned) => {
                    this.conversations.update((list) => {
                        const updated = list.map((c) => (c.id === conversationId ? { ...c, isPinned: newPinned } : c));
                        return updated.sort((a, b) => {
                            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                            return new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime();
                        });
                    });
                    if (this.activeConversation()?.id === conversationId) {
                        this.activeConversation.update((c) => (c ? { ...c, isPinned: newPinned } : null));
                    }
                }),
            );
    }

    deleteConversation(conversationId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/Assistant/DeleteConversation/${conversationId}`).pipe(
            tap(() => {
                this.conversations.update((list) => list.filter((c) => c.id !== conversationId));
                if (this.activeConversation()?.id === conversationId) {
                    const remaining = this.conversations();
                    if (remaining.length > 0) {
                        this.selectConversation(remaining[0].id);
                    } else {
                        this.activeConversation.set(null);
                        this.messages.set([]);
                    }
                }
            }),
        );
    }
}
