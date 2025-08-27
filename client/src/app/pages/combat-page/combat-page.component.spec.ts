import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Timer } from '@app/classes/timer/timer';
import { ChatComponent } from '@app/components/chat/chat.component';
import { PopupColor } from '@app/interfaces/popup';
import { SoundEffect } from '@app/interfaces/sound-service';
import { AudioService } from '@app/services/audio/audio.service';
import { CombatService } from '@app/services/combat/combat.service';
import { MatchService } from '@app/services/match/match.service';
import { PlayService } from '@app/services/play/play.service';
import { PopupService } from '@app/services/popup/popup.service';
import { AVATAR_DATA } from '@common/consts/avatar-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { CombatAction, MatchData, MatchState, PlayerCombatData } from '@common/interfaces/match-data';
import { MOCK_MATCH_DATAS, MOCK_PLAYER_COMBAT_DATAS } from '@common/test-consts/mock-matches';
import { CombatPageComponent } from './combat-page.component';

@Component({
    selector: 'app-chat',
    standalone: true,
    template: '',
})
class MockChatComponent {
    @Input() onClickAction?: () => void;
}

describe('CombatPageComponent', () => {
    let component: CombatPageComponent;
    let fixture: ComponentFixture<CombatPageComponent>;
    let mockMatchService: jasmine.SpyObj<MatchService>;
    let mockCombatService: jasmine.SpyObj<CombatService>;
    let mockPlayService: jasmine.SpyObj<PlayService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockTimer: jasmine.SpyObj<Timer>;
    let mockAudioService: jasmine.SpyObj<AudioService>;
    let popupServiceSpy: jasmine.SpyObj<PopupService>;

    beforeEach(async () => {
        mockMatchService = jasmine.createSpyObj('MatchService', ['isInMatch', 'isState'], {
            matchUpdate: { pipe: () => ({ subscribe: () => ({}) }) },
            data: structuredClone(MOCK_MATCH_DATAS[0]),
        });
        mockCombatService = jasmine.createSpyObj('CombatService', ['attack', 'escape', 'hasPlayerHealed']);
        mockPlayService = jasmine.createSpyObj('PlayService', ['changeDebugMode']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockTimer = jasmine.createSpyObj('Timer', ['maxTime']);
        mockAudioService = jasmine.createSpyObj('AudioService', ['playEffect', 'playBackgroundMusic', 'preloadEffectsForPage', 'playCombatEffect']);
        popupServiceSpy = jasmine.createSpyObj('PopupService', ['showPopup', 'keepMessages']);

        mockCombatService.timer = mockTimer;

        await TestBed.configureTestingModule({
            imports: [CombatPageComponent],
            providers: [
                { provide: MatchService, useValue: mockMatchService },
                { provide: CombatService, useValue: mockCombatService },
                { provide: PlayService, useValue: mockPlayService },
                { provide: Router, useValue: mockRouter },
                { provide: AudioService, useValue: mockAudioService },
                { provide: PopupService, useValue: popupServiceSpy },
            ],
        }).compileComponents();

        TestBed.overrideComponent(CombatPageComponent, {
            add: { imports: [MockChatComponent] },
            remove: { imports: [ChatComponent] },
        });

        fixture = TestBed.createComponent(CombatPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set listener on construction', () => {
        fixture.destroy();
        mockMatchService.isInMatch.and.returnValue(true);
        fixture = TestBed.createComponent(CombatPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should toggle debug mode d key press', () => {
        const mockEvent = new KeyboardEvent('keydown', { key: 'D' });
        component.onKeyDown(mockEvent);
        expect(mockPlayService.changeDebugMode).toHaveBeenCalled();
    });

    it('attack button should call attack', () => {
        component.attackButton();
        expect(mockCombatService.attack).toHaveBeenCalled();
    });

    it('escape button should call escape', () => {
        component.escapeButon();
        expect(mockCombatService.escape).toHaveBeenCalled();
    });

    it('update images should update visual data', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const updateImagesSpy = spyOn(component as any, 'updateImages').and.callThrough();
        component['updateImages']();
        expect(updateImagesSpy).toHaveBeenCalled();
    });

    it('check for redirect should check state', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const checkForRedirectSpy = spyOn(component as any, 'checkForRedirect').and.callThrough();
        component['checkForRedirect']();
        expect(checkForRedirectSpy).toHaveBeenCalled();
    });

    it('update players combat data should update first player', () => {
        mockMatchService.selfIndex = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const updatePlayersCombatDataSpy = spyOn(component as any, 'updatePlayersCombatData').and.callThrough();
        component['updatePlayersCombatData']();
        expect(updatePlayersCombatDataSpy).toHaveBeenCalled();
    });

    it('update players combat data should update second player', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const updatePlayersCombatDataSpy = spyOn(component as any, 'updatePlayersCombatData').and.callThrough();
        component['updatePlayersCombatData']();
        expect(updatePlayersCombatDataSpy).toHaveBeenCalled();
    });

    it('should set enemyImage to missingNo when enemy player has Item6', () => {
        component.visualData.selfPlayer = { playerIndex: 0 } as PlayerCombatData;
        component.visualData.enemyPlayer = { playerIndex: 1 } as PlayerCombatData;
        mockMatchService.data.players[0].items = [ItemType.Item6];
        mockMatchService.data.players[1].items = [ItemType.Item6];

        component['computeItems']();

        expect(component.visualData.enemyImage).toEqual(AVATAR_DATA.missingNo.backGif);
        expect(component.visualData.selfImage).toEqual(AVATAR_DATA.missingNo.backGif);
    });

    it('should set displayChat to false when hideChat is called', () => {
        component.displayChat = true;
        expect(component.displayChat).toBeTrue();
        component.hideChat();
        expect(component.displayChat).toBeFalse();
    });

    it('should correctly determine if a player has healed based on health, combat action, and state', () => {
        const playerData: PlayerCombatData = structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]);
        const oldMatchData: MatchData = structuredClone(MOCK_MATCH_DATAS[0]);
        mockMatchService.data.combatData.lastCombatAction = CombatAction.SuccessAttack;
        mockMatchService.data.state = MatchState.CombatWait;

        oldMatchData.combatData.playersCombatData[0].currentHealth = 6;
        let result = component['hasPlayerHealed'](oldMatchData, playerData);
        expect(result).toBeFalse();

        oldMatchData.combatData.playersCombatData[0].currentHealth = 4;
        mockMatchService.data.combatData.lastCombatAction = CombatAction.None;
        result = component['hasPlayerHealed'](oldMatchData, playerData);
        expect(result).toBeFalse();

        mockMatchService.data.combatData.lastCombatAction = CombatAction.SuccessAttack;
        mockMatchService.data.state = MatchState.CombatAnimation;
        result = component['hasPlayerHealed'](oldMatchData, playerData);
        expect(result).toBeFalse();
    });

    it('should display winner popup with enemy name when self player health is 0', () => {
        component.visualData.selfPlayer = {
            playerIndex: 0,
            currentHealth: 0,
        } as PlayerCombatData;

        component.visualData.enemyPlayer = {
            playerIndex: 1,
            currentHealth: 5,
        } as PlayerCombatData;

        mockMatchService.data.players[1].name = 'Enemy Player';

        component['displayPopupMessage']();

        expect(popupServiceSpy.keepMessages).toHaveBeenCalled();
        expect(popupServiceSpy.showPopup).toHaveBeenCalledWith({
            message: 'Enemy Player a gagné le combat',
            hasCloseButton: true,
            isConfirmation: false,
            popupColor: PopupColor.Blue,
        });
    });

    it('should display winner popup with self name when enemy player health is 0', () => {
        component.visualData.selfPlayer = {
            playerIndex: 0,
            currentHealth: 5,
        } as PlayerCombatData;

        component.visualData.enemyPlayer = {
            playerIndex: 1,
            currentHealth: 0,
        } as PlayerCombatData;

        mockMatchService.data.players[0].name = 'Self Player';
        component['displayPopupMessage']();
        expect(popupServiceSpy.keepMessages).toHaveBeenCalled();
        expect(popupServiceSpy.showPopup).toHaveBeenCalledWith({
            message: 'Self Player a gagné le combat',
            hasCloseButton: true,
            isConfirmation: false,
            popupColor: PopupColor.Blue,
        });
    });

    it('should display "Aucun gagnant" when neither player health is 0', () => {
        component.visualData.selfPlayer = {
            playerIndex: 0,
            currentHealth: 3,
        } as PlayerCombatData;

        component.visualData.enemyPlayer = {
            playerIndex: 1,
            currentHealth: 2,
        } as PlayerCombatData;

        component['displayPopupMessage']();
        expect(popupServiceSpy.keepMessages).toHaveBeenCalled();
        expect(popupServiceSpy.showPopup).toHaveBeenCalledWith({
            message: 'Aucun gagnant',
            hasCloseButton: true,
            isConfirmation: false,
            popupColor: PopupColor.Blue,
        });
    });

    it('should ignore repeated key events', () => {
        mockPlayService.changeDebugMode.calls.reset();

        const repeatedKeyEvent = new KeyboardEvent('keydown', {
            key: 'd',
            repeat: true,
        });

        component.onKeyDown(repeatedKeyEvent);

        expect(mockPlayService.changeDebugMode).not.toHaveBeenCalled();
    });

    it('should not process key D when focus is on an INPUT element', () => {
        const inputElement = document.createElement('input');
        document.body.appendChild(inputElement);
        inputElement.focus();

        const keyEvent = new KeyboardEvent('keydown', { key: 'd' });
        component.onKeyDown(keyEvent);

        expect(mockPlayService.changeDebugMode).not.toHaveBeenCalled();

        document.body.removeChild(inputElement);
    });

    it('should redirect and show popup when match state is not in combat', () => {
        mockMatchService.isState.and.returnValue(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const displayPopupSpy = spyOn<any>(component, 'displayPopupMessage');

        component['checkForRedirect']();

        expect(mockMatchService.isState).toHaveBeenCalledWith([MatchState.TurnWait, MatchState.TurnStart, MatchState.MatchEnd]);
        expect(displayPopupSpy).toHaveBeenCalled();
    });

    it('should not redirect when match state is still in combat', () => {
        mockMatchService.isState.and.returnValue(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const displayPopupSpy = spyOn<any>(component, 'displayPopupMessage');

        component['checkForRedirect']();

        expect(mockMatchService.isState).toHaveBeenCalledWith([MatchState.TurnWait, MatchState.TurnStart, MatchState.MatchEnd]);
        expect(displayPopupSpy).not.toHaveBeenCalled();
    });

    it('should play heal effect when there is new healing', () => {
        component.visualData.isSelfHealing = false;
        component.visualData.isEnemyHealing = false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(component, 'hasPlayerHealed').and.returnValues(true, true);

        mockAudioService.playEffect.calls.reset();

        const oldMatchData = structuredClone(MOCK_MATCH_DATAS[0]);
        component['checkHealingAnimation'](oldMatchData);
        expect(mockAudioService.playEffect).toHaveBeenCalledWith(SoundEffect.Heal);
    });
});
