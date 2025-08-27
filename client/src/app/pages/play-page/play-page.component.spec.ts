// eslint-disable-next-line max-classes-per-file -- To have 3 mocked components classes
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Timer } from '@app/classes/timer/timer';
import { ChatComponent } from '@app/components/chat/chat.component';
import { MapComponent } from '@app/components/map/map.component';
import { PlayerInfoPopupComponent } from '@app/components/player-info-popup/player-info-popup.component';
import { SoundEffect } from '@app/interfaces/sound-service';
import { AudioService } from '@app/services/audio/audio.service';
import { MapService } from '@app/services/map/map.service';
import { MatchService } from '@app/services/match/match.service';
import { PlayService } from '@app/services/play/play.service';
import { PopupService } from '@app/services/popup/popup.service';
import { ThumbnailService } from '@app/services/thumbnail/thumbnail.service';
import { TileDescriptionService } from '@app/services/tile-description/tile-description.service';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { MOCK_PLAYER_DATAS } from '@common/test-consts/mock-players';
import { PlayPageComponent } from './play-page.component';

@Component({
    selector: 'app-chat',
    standalone: true,
    template: '',
})
class MockChatComponent {}

@Component({
    selector: 'app-map',
    standalone: true,
    template: '',
})
class MockMapComponent {
    @Input() isEditor: boolean = false;
}

@Component({
    selector: 'app-player-info-popup',
    standalone: true,
    template: '',
})
class MockPlayerInfoPopupComponent {
    @Input() playerIndex: number = 0;
    @Input() isVisible: boolean = false;
    @Input() closeButton: () => void = () => ({});
}

describe('PlayPageComponent', () => {
    let component: PlayPageComponent;
    let fixture: ComponentFixture<PlayPageComponent>;
    let mockTileDescriptionService: jasmine.SpyObj<TileDescriptionService>;
    let mockMatchService: jasmine.SpyObj<MatchService>;
    let mockPlayService: jasmine.SpyObj<PlayService>;
    let mockPopupService: jasmine.SpyObj<PopupService>;
    let mockThumbnailService: jasmine.SpyObj<ThumbnailService>;
    let mockMapService: jasmine.SpyObj<MapService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockTimer: jasmine.SpyObj<Timer>;
    let mockAudioService: jasmine.SpyObj<AudioService>;

    beforeEach(() => {
        mockTimer = jasmine.createSpyObj('Timer', ['isStarted']);
        mockTileDescriptionService = jasmine.createSpyObj('TileDescriptionService', ['displayTileDescription', 'hideTileDescription'], {
            position: { x: 1, y: 1 },
        });
        mockMatchService = jasmine.createSpyObj(
            'MatchService',
            ['isInMatch', 'canUseAction', 'canEndTurn', 'getMovementLeft', 'isState', 'leaveMatch', 'isInventoryFull'],
            {
                matchUpdate: { pipe: () => ({ subscribe: () => ({}) }) },
                data: structuredClone(MOCK_MATCH_DATAS[0]),
                selfPlayer: structuredClone(MOCK_PLAYER_DATAS[0]),
            },
        );
        mockPlayService = jasmine.createSpyObj('PlayService', ['changeDebugMode', 'endTurn', 'displayActions'], {
            timer: mockTimer,
        });
        mockPopupService = jasmine.createSpyObj('PopupService', ['showPopup']);
        mockThumbnailService = jasmine.createSpyObj('ThumbnailService', ['getThumbnail']);
        mockMapService = jasmine.createSpyObj('MapService', ['hasActionOverlay', 'clearActions']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockAudioService = jasmine.createSpyObj('AudioService', ['playEffect', 'playBackgroundMusic', 'preloadEffectsForPage']);

        TestBed.configureTestingModule({
            imports: [PlayPageComponent, MapComponent],
            providers: [
                { provide: TileDescriptionService, useValue: mockTileDescriptionService },
                { provide: MatchService, useValue: mockMatchService },
                { provide: PlayService, useValue: mockPlayService },
                { provide: PopupService, useValue: mockPopupService },
                { provide: ThumbnailService, useValue: mockThumbnailService },
                { provide: MapService, useValue: mockMapService },
                { provide: Router, useValue: mockRouter },
                { provide: AudioService, useValue: mockAudioService },
            ],
        }).compileComponents();

        TestBed.overrideComponent(PlayPageComponent, {
            add: { imports: [MockMapComponent, MockPlayerInfoPopupComponent, MockChatComponent] },
            remove: { imports: [MapComponent, PlayerInfoPopupComponent, ChatComponent] },
        });

        fixture = TestBed.createComponent(PlayPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update avatar list on construction', () => {
        fixture.destroy();
        mockMatchService.isInMatch.and.returnValue(true);
        fixture = TestBed.createComponent(PlayPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should toggle debug mode d key press', () => {
        const mockEvent = new KeyboardEvent('keydown', { key: 'D' });
        component.onKeyDown(mockEvent);
        expect(mockPlayService.changeDebugMode).toHaveBeenCalled();
    });

    it('should action button clear actions', () => {
        mockMapService.hasActionOverlay.and.returnValue(true);
        component['actionButton']();
        expect(mockMapService.clearActions).toHaveBeenCalled();
    });

    it('should action button display actions', () => {
        component.visualData.canUseAction = true;
        component['actionButton']();
        expect(mockPlayService.displayActions).toHaveBeenCalled();
    });

    it('should end turn button call end turn', () => {
        component.visualData.canEndTurn = true;
        component['endTurnButton']();
        expect(mockPlayService.endTurn).toHaveBeenCalled();
    });

    it('should surrender button call popup service', () => {
        component['surrenderButton']();
        expect(mockPopupService.showPopup).toHaveBeenCalled();
    });

    it('should check for redirect to combat page', () => {
        mockMatchService.data.combatData.playersCombatData[0].playerIndex = 0;
        mockMatchService.selfIndex = 0;
        mockMatchService.isState.and.returnValue(true);
        component['checkForRedirect']();
        expect(mockRouter.navigate).toHaveBeenCalledWith([PageEndpoint.Combat]);
    });

    it('should check for redirect to stats page', () => {
        mockMatchService.isState.and.returnValue(true);
        component['checkForRedirect']();
        expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should call displayTileDescription and hideTileDescription', () => {
        const event = new MouseEvent('click');
        component.showTileDescription(event);
        expect(mockTileDescriptionService.displayTileDescription).toHaveBeenCalledWith(event);
        component.hideTileDescription();
        expect(mockTileDescriptionService.hideTileDescription).toHaveBeenCalled();
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

    it('should show player description on infButton', () => {
        const spyShowPlayerDescription = spyOn(component, 'showPlayerDescription');
        component.infoButton();
        expect(spyShowPlayerDescription).toHaveBeenCalled();
    });

    it('should hide info popup on hidePlayerDescription', () => {
        component.hidePlayerDescription();
        expect(component.showPlayerInfoPopup).toBeFalse();
    });
    it('should play item sound when player picks up an item', () => {
        const playerName = 'TestPlayer';
        mockMatchService.selfPlayer.name = playerName;
        mockMatchService.data.logData = [{ content: `${playerName} a ramassé un objet`, timestamp: new Date(), concernedPlayersNamesList: [] }];
        component['lastLogSize'] = 0;
        component['onMatchUpdate']();
        expect(mockAudioService.playEffect).toHaveBeenCalledWith(SoundEffect.Item);
        expect(component['lastLogSize']).toBe(1);
    });
});
