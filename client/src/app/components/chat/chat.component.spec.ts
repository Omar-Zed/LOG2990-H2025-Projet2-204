import { ElementRef, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AudioService } from '@app/services/audio/audio.service';
import { ChatService } from '@app/services/chat/chat.service';
import { MatchService } from '@app/services/match/match.service';
import { ChatLog } from '@common/interfaces/chat-message';
import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
    let component: ChatComponent;
    let fixture: ComponentFixture<ChatComponent>;
    let chatServiceSpy: jasmine.SpyObj<ChatService>;
    let matchServiceSpy: jasmine.SpyObj<MatchService>;
    let scrollToBottomSpy: jasmine.Spy;
    let mockAudioService: jasmine.SpyObj<AudioService>;

    const mockChatData = [
        { sender: 'Player1', content: 'Hello', timestamp: new Date() },
        { sender: 'Player2', content: 'Hi there', timestamp: new Date() },
    ];

    const mockLogData: ChatLog[] = [
        { sender: 'System', content: 'Player1 joined the game', timestamp: new Date(), concernedPlayersNamesList: ['Player1'] },
        { sender: 'System', content: 'Player2 joined the game', timestamp: new Date(), concernedPlayersNamesList: ['Player2'] },
        { sender: 'System', content: 'Game started', timestamp: new Date(), concernedPlayersNamesList: [] },
    ];

    beforeEach(async () => {
        chatServiceSpy = jasmine.createSpyObj('ChatService', ['sendMessage'], {
            isChatActive: signal(true),
            isFilterEnabled: signal(false),
        });

        matchServiceSpy = jasmine.createSpyObj('MatchService', [], {
            data: {
                chatData: mockChatData,
                logData: mockLogData,
            },
            selfPlayer: { name: 'Player1' },
            matchUpdate: {
                subscribe: (callback: () => void) => {
                    callback();
                    return { unsubscribe: () => undefined };
                },
            },
        });
        mockAudioService = jasmine.createSpyObj('AudioService', ['playEffect', 'preloadEffectsForPage']);

        await TestBed.configureTestingModule({
            imports: [ChatComponent, FormsModule],
            providers: [
                { provide: ChatService, useValue: chatServiceSpy },
                { provide: MatchService, useValue: matchServiceSpy },
                { provide: AudioService, useValue: mockAudioService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatComponent);
        component = fixture.componentInstance;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        scrollToBottomSpy = spyOn<any>(component, 'scrollToBottom');

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should switch between chat and logs tabs', () => {
        component.switchTab(false);
        expect(component.isChatActive()).toBeFalse();

        component.switchTab(true);
        expect(component.isChatActive()).toBeTrue();
    });

    it('should toggle filter', () => {
        component.toggleFilter();

        expect(component.isFilterEnabled()).toBeTrue();
        expect(component.logs.length).toBe(1);
    });

    it('should send message on Enter key', async () => {
        const input = document.createElement('input');
        input.value = 'Test message';

        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        Object.defineProperty(event, 'target', { value: input });

        component.sendMessage(event);

        expect(chatServiceSpy.sendMessage).toHaveBeenCalledWith('Test message');
        expect(input.value).toBe('');
    });

    it('should not send message on other keys', async () => {
        const input = document.createElement('input');
        input.value = 'Test message';

        const event = new KeyboardEvent('keydown', { key: 'A' });
        Object.defineProperty(event, 'target', { value: input });

        component.sendMessage(event);

        expect(chatServiceSpy.sendMessage).not.toHaveBeenCalled();
        expect(input.value).toBe('Test message');
    });

    it('should not send empty messages', async () => {
        const input = document.createElement('input');
        input.value = '   ';

        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        Object.defineProperty(event, 'target', { value: input });

        component.sendMessage(event);

        expect(chatServiceSpy.sendMessage).not.toHaveBeenCalled();
    });

    it('should update chat messages and logs from match service', () => {
        component['updateChatData']();

        expect(component.chatMessages).toEqual(mockChatData);
        expect(component.logs.length).toBe(2);
        expect(scrollToBottomSpy).toHaveBeenCalled();

        component.isFilterEnabled.set(true);
        component['updateChatData']();
        expect(component.logs.length).toBe(1);
    });

    it('should filter logs based on player name when filter is enabled', () => {
        component.isFilterEnabled.set(true);

        component['filterLogs']();

        expect(component.logs.length).toBe(1);
        expect(component.logs[0].concernedPlayersNamesList).toContain('Player1');
    });

    it('should correctly call scrollToBottom method when needed', () => {
        scrollToBottomSpy.and.callThrough();

        const mockElement = {
            nativeElement: {
                scrollTop: 0,
                scrollHeight: 100,
            },
        };

        component['chatContainerRef'] = mockElement as ElementRef;

        component['shouldScrollToBottom'] = true;

        component.ngAfterViewChecked();

        expect(mockElement.nativeElement.scrollTop).toBe(mockElement.nativeElement.scrollHeight);

        expect(component['shouldScrollToBottom']).toBeFalse();
    });
});
