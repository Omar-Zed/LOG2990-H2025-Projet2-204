import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AudioService } from '@app/services/audio/audio.service';
import { LobbyService } from '@app/services/lobby/lobby.service';
import { MatchService } from '@app/services/match/match.service';
import { PopupService } from '@app/services/popup/popup.service';
import { Avatar } from '@common/interfaces/player-data';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { MOCK_PLAYER_DATAS } from '@common/test-consts/mock-players';
import { CharacterPageComponent } from './character-page.component';

describe('CharacterPageComponent', () => {
    let component: CharacterPageComponent;
    let fixture: ComponentFixture<CharacterPageComponent>;
    let mockMatchService: jasmine.SpyObj<MatchService>;
    let mockPopupService: jasmine.SpyObj<PopupService>;
    let mockLobbyService: jasmine.SpyObj<LobbyService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockAudioService: jasmine.SpyObj<AudioService>;

    beforeEach(async () => {
        mockMatchService = jasmine.createSpyObj('MatchService', ['isInMatch', 'leaveMatch', 'selfPlayer', 'selfIndex', 'matchUpdate'], {
            data: structuredClone(MOCK_MATCH_DATAS[0]),
            selfPlayer: structuredClone(MOCK_PLAYER_DATAS[0]),
            matchUpdate: { pipe: () => ({ subscribe: () => ({}) }) },
        });
        mockAudioService = jasmine.createSpyObj('AudioService', ['playEffect', 'preloadEffectsForPage']);
        mockPopupService = jasmine.createSpyObj('PopupService', ['showPopup']);
        mockLobbyService = jasmine.createSpyObj('LobbyService', ['joinLobby', 'changeAvatar']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, CharacterPageComponent],
            providers: [
                { provide: MatchService, useValue: mockMatchService },
                { provide: PopupService, useValue: mockPopupService },
                { provide: LobbyService, useValue: mockLobbyService },
                { provide: Router, useValue: mockRouter },
                { provide: AudioService, useValue: mockAudioService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update avatar list on construction', () => {
        fixture.destroy();
        mockMatchService.isInMatch.and.returnValue(true);
        fixture = TestBed.createComponent(CharacterPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should show popup with confirmation and bind leaveMatch', () => {
        component.goToMenu();
        expect(mockPopupService.showPopup).toHaveBeenCalled();
    });

    it('should toggle is attack selected', () => {
        component.visualData.isAttackSelected = true;
        component.toggleBonusDice();
        expect(component.visualData.isAttackSelected).toBeFalse();
    });

    it('should get player data correctly', () => {
        component.visualData.isHpSelected = false;
        component.visualData.isAttackSelected = false;
        component['getPlayerData']();
        expect(component.visualData.isAttackSelected).toBeFalse();
    });

    it('should show popup with warnings if name form is invalid', () => {
        component.nameForm.setValue('ab');
        component.joinLobby();
        expect(mockPopupService.showPopup).toHaveBeenCalled();
        expect(mockLobbyService.joinLobby).not.toHaveBeenCalled();
    });

    it('should show popup with avatar warning if avatar is Default', () => {
        component.nameForm.setValue('ValidName');
        mockMatchService.selfPlayer.avatar = Avatar.Default;
        component.joinLobby();
        expect(mockPopupService.showPopup).toHaveBeenCalled();
        expect(mockLobbyService.joinLobby).not.toHaveBeenCalled();
    });

    it('should call lobbyService.joinLobby with player data if no warnings', () => {
        component.nameForm.setValue('ValidName');
        mockMatchService.selfPlayer.avatar = Avatar.Avatar7;
        component.visualData.isHpSelected = true;
        component.visualData.isAttackSelected = true;
        component.joinLobby();
        expect(mockLobbyService.joinLobby).toHaveBeenCalled();
    });

    it('should call lobbyService.changeAvatar if avatar is not locked', () => {
        component.changeAvatar(Avatar.Avatar7);
        expect(mockLobbyService.changeAvatar).toHaveBeenCalledWith(Avatar.Avatar7);
    });

    it('should show popup with confirmation and bind leaveMatch action correctly', () => {
        mockPopupService.showPopup.and.callFake((popupMessage) => {
            const capturedPopupMessage = popupMessage;

            expect(capturedPopupMessage.message).toBe('Voulez-vous vraiment quitter ?');
            expect(capturedPopupMessage.hasCloseButton).toBeTrue();
            expect(capturedPopupMessage.isConfirmation).toBeTrue();
            expect(capturedPopupMessage.action).toBeDefined();

            capturedPopupMessage.action?.();
            expect(mockMatchService.leaveMatch).toHaveBeenCalled();
        });

        component.goToMenu();

        expect(mockPopupService.showPopup).toHaveBeenCalled();
    });

    it('should call joinLobby when Enter key is pressed', () => {
        spyOn(component, 'joinLobby');
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        component.onKeyDown(enterEvent);
        expect(component.joinLobby).toHaveBeenCalled();
    });
});
