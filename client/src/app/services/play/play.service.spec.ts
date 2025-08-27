import { TestBed } from '@angular/core/testing';
import { Timer } from '@app/classes/timer/timer';
import { MapService } from '@app/services/map/map.service';
import { MatchService } from '@app/services/match/match.service';
import { MovementService } from '@app/services/movement/movement.service';
import { SocketService } from '@app/services/socket/socket.service';
import { ItemType } from '@common/interfaces/item-type.enum';
import { MatchData } from '@common/interfaces/match-data';
import { Position } from '@common/interfaces/position';
import { PlayEvent } from '@common/interfaces/socket-event.enum';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { PlayService } from './play.service';

describe('PlayService', () => {
    let service: PlayService;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let matchServiceSpy: jasmine.SpyObj<MatchService>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let movementServiceSpy: jasmine.SpyObj<MovementService>;
    let timerSpy: jasmine.SpyObj<Timer>;
    let mockMatchData: MatchData;

    beforeEach(() => {
        mockMatchData = structuredClone(MOCK_MATCH_DATAS[0]);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['emit']);
        matchServiceSpy = jasmine.createSpyObj('MatchService', ['isState', 'isActivePlayer', 'isHost'], {
            data: mockMatchData,
            selfPlayer: { position: { x: 1, y: 1 } },
            matchUpdate: { pipe: () => ({ subscribe: () => ({}) }) },
        });
        mapServiceSpy = jasmine.createSpyObj('MapService', [
            'setHoverMoves',
            'setPossibleMoves',
            'setActions',
            'clearOverlays',
            'movePlayer',
            'hasActionOverlay',
            'clearActions',
            'setPlayers',
        ]);
        movementServiceSpy = jasmine.createSpyObj('MovementService', ['getActions', 'getShortestPath', 'getPossibleMoves']);
        timerSpy = jasmine.createSpyObj('Timer', ['startTimer', 'pauseTimer']);

        TestBed.configureTestingModule({
            providers: [
                PlayService,
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: MatchService, useValue: matchServiceSpy },
                { provide: MapService, useValue: mapServiceSpy },
                { provide: MovementService, useValue: movementServiceSpy },
            ],
        });

        service = TestBed.inject(PlayService);
        service.timer = timerSpy;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should end turn emit end turn event', () => {
        service.endTurn();
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(PlayEvent.EndTurn);
    });

    it('right click tile should emit debug move if conditions met', () => {
        const position: Position = { x: 1, y: 2 };
        matchServiceSpy.data.playData.isDebugMode = true;
        matchServiceSpy.isActivePlayer.and.returnValue(true);
        service.rightClickTile(position);
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(PlayEvent.DebugMove, position);
    });

    it('click tile should emit move', () => {
        const position: Position = { x: 1, y: 2 };
        matchServiceSpy.isActivePlayer.and.returnValue(true);
        matchServiceSpy.isState.and.returnValue(true);
        mapServiceSpy.hasActionOverlay.and.returnValue(false);
        service.clickTile(position);
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(PlayEvent.Move, position);
        expect(mapServiceSpy.clearActions).toHaveBeenCalled();
    });

    it('click tile should emit action', () => {
        const position: Position = { x: 2, y: 2 };
        matchServiceSpy.isActivePlayer.and.returnValue(true);
        matchServiceSpy.isState.and.returnValue(true);
        mapServiceSpy.hasActionOverlay.and.returnValue(true);
        service.clickTile(position);
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(PlayEvent.Action, position);
        expect(mapServiceSpy.clearActions).toHaveBeenCalled();
    });

    it('display actions should set actions on map', () => {
        const actions = [{ x: 1, y: 2 }];
        movementServiceSpy.getActions.and.returnValue(actions);
        service.displayActions();
        expect(mapServiceSpy.setActions).toHaveBeenCalledWith(actions, matchServiceSpy.selfPlayer.position);
    });

    it('display movement path should set hover moves if valid', () => {
        const target: Position = { x: 2, y: 2 };
        const shortestPath = {
            moveCost: 1,
            path: [{ x: 3, y: 2 }],
        };
        movementServiceSpy.getShortestPath.and.returnValue(shortestPath);
        matchServiceSpy.data.playData.movementLeft = 2;
        matchServiceSpy.isState.and.returnValue(true);
        matchServiceSpy.isActivePlayer.and.returnValue(true);
        service.displayMovementPath(target);
        expect(mapServiceSpy.setHoverMoves).toHaveBeenCalledWith(shortestPath.path);
    });

    it('display movement path should set empty hover moves if invalid', () => {
        const target: Position = { x: 2, y: 2 };
        const shortestPath = {
            moveCost: 999,
            path: [{ x: 3, y: 2 }],
        };
        movementServiceSpy.getShortestPath.and.returnValue(shortestPath);
        matchServiceSpy.data.playData.movementLeft = 2;
        matchServiceSpy.isState.and.returnValue(true);
        matchServiceSpy.isActivePlayer.and.returnValue(true);
        service.displayMovementPath(target);
        expect(mapServiceSpy.setHoverMoves).toHaveBeenCalledWith([]);
    });

    it('change debug mode should emit event if host', () => {
        matchServiceSpy.isHost.and.returnValue(true);
        matchServiceSpy.data.playData.isDebugMode = false;
        service.changeDebugMode();
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(PlayEvent.ChangeDebugMode, true);
    });

    it('on match update should call update methods', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private methods
        spyOn<any>(service, 'updateOverlays');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private methods
        spyOn<any>(service, 'updateMovement');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private methods
        spyOn<any>(service, 'updateTimer');
        const oldMatchData = structuredClone(mockMatchData);
        service['onMatchUpdate'](oldMatchData);
        expect(service['updateOverlays']).toHaveBeenCalled();
        expect(service['updateMovement']).toHaveBeenCalledWith(oldMatchData);
        expect(service['updateTimer']).toHaveBeenCalled();
    });

    it('update movement should call move player', () => {
        movementServiceSpy.getShortestPath.and.returnValue({ moveCost: 0, path: [] });
        matchServiceSpy.isState.and.returnValue(true);
        service['updateMovement'](mockMatchData);
        expect(mapServiceSpy.movePlayer).toHaveBeenCalled();
    });

    it('update timer should start or pause timer based on state', () => {
        matchServiceSpy.isState.and.returnValue(true);
        service['updateTimer']();
        expect(timerSpy.startTimer).toHaveBeenCalled();
    });

    it('update overlays should display moves or clear overlays', () => {
        matchServiceSpy.isState.and.returnValue(true);
        matchServiceSpy.isActivePlayer.and.returnValue(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'displayPossibleMoves');
        service['updateOverlays']();
        expect(service['displayPossibleMoves']).toHaveBeenCalled();
    });

    it('display possible moves should set possible moves on map', () => {
        const moves = [{ x: 1, y: 2 }];
        movementServiceSpy.getPossibleMoves.and.returnValue(moves);
        service['displayPossibleMoves']();
        expect(mapServiceSpy.setPossibleMoves).toHaveBeenCalledWith(moves, matchServiceSpy.selfPlayer.position);
    });

    it('dropItem should emit drop item event with correct item type', () => {
        const itemType = ItemType.Item1;

        service.dropItem(itemType);
        expect(socketServiceSpy.emit).toHaveBeenCalledWith(PlayEvent.DropItem, itemType);
    });
});
