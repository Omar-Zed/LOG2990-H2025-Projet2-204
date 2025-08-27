import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatchService } from '@app/services/match/match.service';
import { SocketService } from '@app/services/socket/socket.service';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { MatchState } from '@common/interfaces/match-data';
import { Avatar, PlayerType } from '@common/interfaces/player-data';
import { LobbyEvent } from '@common/interfaces/socket-event.enum';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { MOCK_PLAYER_DATAS } from '@common/test-consts/mock-players';
import { LobbyService } from './lobby.service';

describe('LobbyService', () => {
    let service: LobbyService;
    let mockSocketService: jasmine.SpyObj<SocketService>;
    let mockMatchService: jasmine.SpyObj<MatchService>;
    let mockRouter: jasmine.SpyObj<Router>;

    beforeEach(() => {
        mockSocketService = jasmine.createSpyObj('SocketService', ['emit'], { selfId: 'self-id' });
        mockMatchService = jasmine.createSpyObj('MatchService', ['isState'], {
            matchUpdate: { pipe: () => ({ subscribe: () => ({}) }) },
            selfPlayer: { isConnected: true },
        });
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [
                LobbyService,
                { provide: SocketService, useValue: mockSocketService },
                { provide: MatchService, useValue: mockMatchService },
                { provide: Router, useValue: mockRouter },
            ],
        });

        service = TestBed.inject(LobbyService);
    });

    it('kickPlayer should emit KickPlayer event with playerId', () => {
        service.kickPlayer('player-123');
        expect(mockSocketService.emit).toHaveBeenCalledWith(LobbyEvent.KickPlayer, 'player-123');
    });

    it('changeAvatar should emit ChangeAvatar event with avatar', () => {
        service.changeAvatar(Avatar.Avatar7);
        expect(mockSocketService.emit).toHaveBeenCalledWith(LobbyEvent.ChangeAvatar, Avatar.Avatar7);
    });

    it('joinLobby should emit JoinLobby event with playerData', () => {
        const playerData = structuredClone(MOCK_PLAYER_DATAS[0]);
        service.joinLobby(playerData);
        expect(mockSocketService.emit).toHaveBeenCalledWith(LobbyEvent.JoinLobby, playerData);
    });

    it('changeLockStatus should emit ChangeLockStatus event with lockStatus', () => {
        service.changeLockStatus(true);
        expect(mockSocketService.emit).toHaveBeenCalledWith(LobbyEvent.ChangeLockStatus, true);
    });

    it('startMatch should emit StartMatch event', () => {
        service.startMatch();
        expect(mockSocketService.emit).toHaveBeenCalledWith(LobbyEvent.StartMatch);
    });

    it('addBot should emit AddBot event', () => {
        service.addBot(PlayerType.BotDefensive);
        expect(mockSocketService.emit).toHaveBeenCalledWith(LobbyEvent.AddBot, PlayerType.BotDefensive);
    });

    it('on match update should navigate to lobby', () => {
        mockMatchService.isState.and.returnValue(true);
        Object.defineProperty(mockSocketService, 'selfId', { value: 'selfId' });
        const oldMatchData = structuredClone(MOCK_MATCH_DATAS[0]);
        oldMatchData.players[0].isConnected = false;
        oldMatchData.players[0].id = 'selfId';
        mockMatchService.selfPlayer.isConnected = true;
        service['onMatchUpdate'](oldMatchData);
        expect(mockRouter.navigate).toHaveBeenCalledWith([PageEndpoint.Lobby]);
    });

    it('on match update should navigate to lobby', () => {
        mockMatchService.isState.and.returnValue(true);
        const oldMatchData = structuredClone(MOCK_MATCH_DATAS[0]);
        oldMatchData.state = MatchState.Lobby;
        service['onMatchUpdate'](oldMatchData);
        expect(mockRouter.navigate).toHaveBeenCalledWith([PageEndpoint.Play]);
    });
});
