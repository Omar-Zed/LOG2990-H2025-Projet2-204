import { Match } from '@app/classes/match/match';
import { LobbyService } from '@app/services/lobby/lobby.service';
import { MatchService } from '@app/services/match/match.service';
import { Avatar, PlayerType } from '@common/interfaces/player-data';
import { MOCK_PLAYER_DATAS } from '@common/test-consts/mock-players';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStub, SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { LobbyGateway } from './lobby.gateway';

describe('LobbyGateway', () => {
    let gateway: LobbyGateway;
    let mockSocket: SinonStubbedInstance<Socket>;
    let mockServer: SinonStubbedInstance<Server>;
    let mockLobbyService: SinonStubbedInstance<LobbyService>;
    let mockMatchService: SinonStubbedInstance<MatchService>;
    let emitStub: SinonStub;
    let mockMatch: SinonStubbedInstance<Match>;

    beforeEach(async () => {
        mockSocket = createStubInstance<Socket>(Socket);
        mockLobbyService = createStubInstance<LobbyService>(LobbyService);
        mockMatchService = createStubInstance<MatchService>(MatchService);
        mockServer = createStubInstance<Server>(Server);
        emitStub = stub();
        mockMatch = createStubInstance<Match>(Match);
        mockMatchService.getMatchFromPlayerId.returns(mockMatch);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LobbyGateway,
                { provide: MatchService, useValue: mockMatchService },
                { provide: LobbyService, useValue: mockLobbyService },
                { provide: Server, useValue: mockServer },
            ],
        }).compile();

        gateway = module.get<LobbyGateway>(LobbyGateway);

        gateway['server'] = {
            to: () => ({ emit: emitStub }),
            sockets: { sockets: { get: () => mockSocket } },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 'any' used to mock a partial Server object
        } as any;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should call kick player on kick player event', () => {
        const targetPlayerId = 'player2';
        gateway.kickPlayer(mockSocket, targetPlayerId);
        expect(mockLobbyService.kickPlayer.calledWith(mockMatch, mockSocket.id, targetPlayerId)).toBeTruthy();
    });

    it('should call change avatar on change avatar event', () => {
        const avatar = Avatar.Avatar8;
        gateway.changeAvatar(mockSocket, avatar);
        expect(mockLobbyService.changeAvatar.calledWith(mockMatch, mockSocket.id, avatar)).toBeTruthy();
    });

    it('should call add bot on add bot event', () => {
        const botType = PlayerType.BotDefensive;
        gateway.addBot(mockSocket, botType);
        expect(mockLobbyService.addBot.calledWith(mockMatch, botType)).toBeTruthy();
    });

    it('should call join lobby on join lobby event', () => {
        const playerData = structuredClone(MOCK_PLAYER_DATAS[0]);
        gateway.joinLobby(mockSocket, playerData);
        expect(mockLobbyService.joinLobby.calledWith(mockMatch, mockSocket.id, playerData)).toBeTruthy();
    });

    it('should call change lock status on change lock status event', () => {
        const lockStatus = true;
        gateway.changeLockStatus(mockSocket, lockStatus);
        expect(mockLobbyService.changeLockStatus.calledWith(mockMatch, mockSocket.id, lockStatus)).toBeTruthy();
    });

    it('should call start match on change start match event', () => {
        gateway.startMatch(mockSocket);
        expect(mockLobbyService.startMatch.calledWith(mockMatch, mockSocket.id)).toBeTruthy();
    });
});
