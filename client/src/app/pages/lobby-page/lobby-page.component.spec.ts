import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ChatComponent } from '@app/components/chat/chat.component';
import { AudioService } from '@app/services/audio/audio.service';
import { LobbyService } from '@app/services/lobby/lobby.service';
import { MatchService } from '@app/services/match/match.service';
import { PopupService } from '@app/services/popup/popup.service';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { PlayerType } from '@common/interfaces/player-data';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { LobbyPageComponent } from './lobby-page.component';

@Component({
    selector: 'app-chat',
    standalone: true,
    template: '',
})
class MockChatComponent {}

describe('LobbyPageComponent', () => {
    let component: LobbyPageComponent;
    let fixture: ComponentFixture<LobbyPageComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let matchServiceSpy: jasmine.SpyObj<MatchService>;
    let lobbyServiceSpy: jasmine.SpyObj<LobbyService>;
    let popupServiceSpy: jasmine.SpyObj<PopupService>;
    let mockAudioService: jasmine.SpyObj<AudioService>;

    beforeEach(async () => {
        const mockMatchData = structuredClone(MOCK_MATCH_DATAS[0]);
        mockMatchData.players.pop();

        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        popupServiceSpy = jasmine.createSpyObj('PopupService', ['showPopup']);
        lobbyServiceSpy = jasmine.createSpyObj('LobbyService', ['startMatch', 'kickPlayer', 'changeLockStatus', 'addBot']);
        matchServiceSpy = jasmine.createSpyObj('MatchService', ['isInMatch', 'isState', 'isHost', 'leaveMatch'], {
            matchUpdate: { pipe: () => ({ subscribe: () => ({}) }) },
            data: mockMatchData,
            selfIndex: 0,
            isHost: () => true,
        });
        mockAudioService = jasmine.createSpyObj('AudioService', ['playEffect', 'playBackgroundMusic', 'preloadEffectsForPage', 'playCombatEffect']);

        await TestBed.configureTestingModule({
            imports: [LobbyPageComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: PopupService, useValue: popupServiceSpy },
                { provide: LobbyService, useValue: lobbyServiceSpy },
                { provide: MatchService, useValue: matchServiceSpy },
                { provide: AudioService, useValue: mockAudioService },
            ],
        }).compileComponents();

        TestBed.overrideComponent(LobbyPageComponent, {
            add: { imports: [MockChatComponent] },
            remove: { imports: [ChatComponent] },
        });

        fixture = TestBed.createComponent(LobbyPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update avatar list on construction', () => {
        fixture.destroy();
        matchServiceSpy.isInMatch.and.returnValue(true);
        fixture = TestBed.createComponent(LobbyPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should navigate to home when matchCode is empty', () => {
        fixture.destroy();

        Object.defineProperty(lobbyServiceSpy, 'matchCode', { value: '', configurable: true });

        fixture = TestBed.createComponent(LobbyPageComponent);
        component = fixture.componentInstance;

        fixture.detectChanges();
        expect(routerSpy.navigate).toHaveBeenCalledWith([PageEndpoint.Menu]);
    });

    it('should start match button call start match', () => {
        component.startMatchButton();
        expect(lobbyServiceSpy.startMatch).toHaveBeenCalled();
    });

    it('should toggle lock room change lock status', () => {
        component.toggleLockRoom();
        expect(lobbyServiceSpy.changeLockStatus).toHaveBeenCalled();
    });

    it('should call showPopup when leaveLobbyButton is called', () => {
        component.leaveLobbyButton();
        expect(popupServiceSpy.showPopup).toHaveBeenCalled();
    });

    it('should kickPlayer when kickPlayer is called', () => {
        component.kickPlayer('playerId');
        expect(lobbyServiceSpy.kickPlayer).toHaveBeenCalledWith('playerId');
    });

    it('should copy match code to clipboard', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const copyToClipboardSpy = spyOn(component as any, 'copyToClipboard').and.returnValue(true);
        component.copyMatchCode();
        expect(copyToClipboardSpy).toHaveBeenCalled();
    });

    it('should do nothing when Escape key is pressed and bot popup is hidden', () => {
        component.showBotPopup = true;
        fixture.detectChanges();
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escapeEvent);

        expect(component.showBotPopup).toBeFalse();
    });

    it('should showPopup if add Bot button is triggered', () => {
        component.showBotPopup = false;
        component.showBotCreationPopup();
        expect(component.showBotPopup).toBeTrue();
    });

    it('should showPopup if add Bot button is triggered', () => {
        component.showBotPopup = true;
        const defesiveBot: PlayerType = PlayerType.BotDefensive;
        component.handleBotTypeSelected(defesiveBot);
        expect(lobbyServiceSpy.addBot).toHaveBeenCalledWith(defesiveBot);
        expect(component.showBotPopup).toBeFalse();
    });

    it('should updateVisual on matchUpdate', () => {
        component['updateVisual']();
        expect(component.visualData.isSelfHost).toBeTrue();
    });

    it('copy to clipboard should not throw error', () => {
        expect(() => {
            component['copyToClipboard']('1234');
        }).not.toThrow();
    });
});
