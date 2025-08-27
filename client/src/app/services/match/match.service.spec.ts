import { TestBed } from '@angular/core/testing';
import { NavigationStart, Router } from '@angular/router';
import { Popup, PopupColor } from '@app/interfaces/popup';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { MapService } from '@app/services/map/map.service';
import { PopupService } from '@app/services/popup/popup.service';
import { SocketService } from '@app/services/socket/socket.service';
import { MAX_ITEMS } from '@common/consts/player-data.const';
import { WARNING_MESSAGES } from '@common/consts/warning-messages';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { MatchState } from '@common/interfaces/match-data';
import { MessageFromServer } from '@common/interfaces/message-from-server';
import { Message } from '@common/interfaces/message.enum';
import { PlayerData } from '@common/interfaces/player-data';
import { MatchEvent } from '@common/interfaces/socket-event.enum';
import { MOCK_GAME_DATAS } from '@common/test-consts/mock-games';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { MatchService } from './match.service';

describe('MatchService', () => {
    let service: MatchService;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let gameDataServiceSpy: jasmine.SpyObj<GameDataService>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let popupServiceSpy: jasmine.SpyObj<PopupService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['emit', 'on'], { selfId: 'selfId' });
        gameDataServiceSpy = jasmine.createSpyObj('GameDataService', ['setGameData', 'gameData']);
        mapServiceSpy = jasmine.createSpyObj('MapService', ['startMatch', 'setPlayers', 'clearOverlays']);
        popupServiceSpy = jasmine.createSpyObj('PopupService', ['showPopup', 'keepMessages', 'clearMessages']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate'], { events: { subscribe: () => ({}) } });

        TestBed.configureTestingModule({
            providers: [
                MatchService,
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: GameDataService, useValue: gameDataServiceSpy },
                { provide: MapService, useValue: mapServiceSpy },
                { provide: PopupService, useValue: popupServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        });

        service = TestBed.inject(MatchService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should leave match emit leave match event', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'isInMatch').and.returnValue(true);
        service.leaveMatch();
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(MatchEvent.LeaveMatch);
    });

    it('create match should emit create match event', () => {
        const gameData = structuredClone(MOCK_GAME_DATAS[0]);
        service.createMatch(gameData);
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(MatchEvent.CreateMatch, gameData, jasmine.any(Function));
    });

    it('join match should emit join match event', () => {
        const matchCode = 'testCode';
        service.joinMatch(matchCode);
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(MatchEvent.JoinMatch, matchCode, jasmine.any(Function));
    });

    it('is active player should return true if self is active', () => {
        service.selfIndex = 0;
        service.data.playData.activePlayerIndex = 0;
        const result = service.isActivePlayer();
        expect(result).toBeTrue();
    });

    it('can use debug move should return true if debug mode and active', () => {
        service.data.playData.isDebugMode = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'isActivePlayer').and.returnValue(true);
        const result = service.canUseDebugMove();
        expect(result).toBeTrue();
    });

    it('is host should return true if self is host', () => {
        service.selfIndex = 0;
        service.data.lobbyData.hostPlayerIndex = 0;
        const result = service.isHost();
        expect(result).toBeTrue();
    });

    it('is in match should return true if selfIndex is non-negative', () => {
        service.selfIndex = 0;
        const result = service.isInMatch();
        expect(result).toBeTrue();
    });

    it('is state should return true if current state matches', () => {
        service.data.state = MatchState.TurnWait;
        const result = service.isState([MatchState.TurnWait]);
        expect(result).toBeTrue();
    });

    it('can use action should return true if conditions met', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'isActivePlayer').and.returnValue(true);
        service.data.state = MatchState.TurnWait;
        service.data.playData.hasAction = true;
        const result = service.canUseAction();
        expect(result).toBeTrue();
    });

    it('can end turn should return true if conditions met', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'isActivePlayer').and.returnValue(true);
        service.data.state = MatchState.TurnWait;
        const result = service.canEndTurn();
        expect(result).toBeTrue();
    });

    it('get movement left should return movement if active', () => {
        const movement = 5;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'isActivePlayer').and.returnValue(true);
        service.data.playData.movementLeft = movement;
        const result = service.getMovementLeft();
        expect(result).toBe(movement);
    });

    it('get movement left should return zero if not active', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'isActivePlayer').and.returnValue(false);
        const result = service.getMovementLeft();
        expect(result).toBe(0);
    });

    it('on navigation update should leave match', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const leaveMatchSpy = spyOn<any>(service, 'leaveMatch');
        service['onNavigationUpdate'](new NavigationStart(1, 'aaa', 'popstate'));
        expect(leaveMatchSpy).toHaveBeenCalled();
    });

    it('on match joined should update match data', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const onUpdateSpy = spyOn<any>(service, 'onUpdate');
        service['onMatchJoined'](structuredClone(MOCK_MATCH_DATAS[0]));
        expect(onUpdateSpy).toHaveBeenCalled();
    });

    it('on disconnect should handle disconnection', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'isInMatch').and.returnValue(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'resetMatchData');
        service['onDisconnect']();
        expect(popupServiceSpy.keepMessages).toHaveBeenCalled();
        expect(popupServiceSpy.showPopup).toHaveBeenCalled();
        expect(service['resetMatchData']).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith([PageEndpoint.Menu]);
    });

    it('on update should update match data', () => {
        const matchData = structuredClone(MOCK_MATCH_DATAS[0]);
        matchData.players[0].id = 'selfId';
        service['onUpdate'](matchData);
        expect(service.data).toBe(matchData);
        expect(service.selfIndex).toBe(0);
        expect(gameDataServiceSpy.setGameData).toHaveBeenCalledWith(matchData.gameData);
    });

    it('on message should show popup with message', () => {
        const messageFromServer = {
            message: 'Test message',
            hasCloseButton: false,
        } as MessageFromServer;
        service['onMessage'](messageFromServer);
        expect(popupServiceSpy.showPopup).toHaveBeenCalled();
    });

    it('on removed from match should handle removal', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'isInMatch').and.returnValue(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'resetMatchData');
        const reason = 'Kicked';
        service['onRemovedFromMatch'](reason);
        expect(popupServiceSpy.keepMessages).toHaveBeenCalled();
        expect(popupServiceSpy.showPopup).toHaveBeenCalled();
        expect(service['resetMatchData']).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith([PageEndpoint.Menu]);
    });

    it('on removed from match should navigate to join page and handle popup action when locked from lobby', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'isInMatch').and.returnValue(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'resetMatchData');
        const reason = Message.LockedFromLobby;

        let popupConfig: Popup;

        popupServiceSpy.showPopup.and.callFake((config) => {
            popupConfig = config;
            if (popupConfig.action) {
                popupConfig.action();
            }
        });

        service['onRemovedFromMatch'](reason);
        expect(routerSpy.navigate).toHaveBeenCalledWith([PageEndpoint.Join]);

        expect(routerSpy.navigate).toHaveBeenCalledWith([PageEndpoint.Menu]);
    });

    it('reset match data should clear match state', () => {
        spyOn(service.matchUpdate, 'next');
        service['resetMatchData']();
        expect(service.data.state).toEqual(MatchState.Lobby);
        expect(service.selfIndex).toBe(-1);
        expect(mapServiceSpy.setPlayers).toHaveBeenCalledWith([]);
        expect(mapServiceSpy.clearOverlays).toHaveBeenCalled();
        expect(service.matchUpdate.next).toHaveBeenCalled();
    });

    it('should correctly determine if the player inventory is full', () => {
        service.selfPlayer = {
            items: new Array(MAX_ITEMS + 1).fill({}),
        } as PlayerData;

        let result = service.isInventoryFull();

        expect(result).toBeTrue();

        service.selfPlayer = {
            items: new Array(MAX_ITEMS).fill({}),
        } as PlayerData;

        result = service.isInventoryFull();

        expect(result).toBeFalse();
    });
    it('onPopup should show popup with message and close button', () => {
        const messageFromServer = {
            message: 'Test popup message',
            hasCloseButton: true,
        } as MessageFromServer;
        service['onMessage'](messageFromServer);

        expect(popupServiceSpy.showPopup).toHaveBeenCalled();

        expect(popupServiceSpy.showPopup).toHaveBeenCalledWith(jasmine.objectContaining(messageFromServer));
    });

    it('should show orange popup when message is in WARNING_MESSAGES', () => {
        const warningMessage = WARNING_MESSAGES[0];
        const messageFromServer = {
            message: warningMessage,
            hasCloseButton: true,
        } as MessageFromServer;

        service['onMessage'](messageFromServer);

        expect(popupServiceSpy.showPopup).toHaveBeenCalledWith({
            message: warningMessage,
            hasCloseButton: true,
            isConfirmation: false,
            popupColor: PopupColor.Orange,
        });
    });
});
