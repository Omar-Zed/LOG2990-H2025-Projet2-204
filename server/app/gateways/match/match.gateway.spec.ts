import { Match } from '@app/classes/match/match';
import { MatchService } from '@app/services/match/match.service';
import { MatchEvent } from '@common/interfaces/socket-event.enum';
import { MOCK_GAME_DATAS } from '@common/test-consts/mock-games';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStub, SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { MatchGateway } from './match.gateway';

describe('MatchGateway', () => {
    let gateway: MatchGateway;
    let mockSocket: SinonStubbedInstance<Socket>;
    let mockServer: SinonStubbedInstance<Server>;
    let mockMatchService: SinonStubbedInstance<MatchService>;
    let emitStub: SinonStub;
    let mockMatch: SinonStubbedInstance<Match>;

    beforeEach(async () => {
        mockSocket = createStubInstance<Socket>(Socket);
        mockMatchService = createStubInstance<MatchService>(MatchService);
        mockServer = createStubInstance<Server>(Server);
        emitStub = stub();
        mockMatch = createStubInstance<Match>(Match);
        mockMatchService.getMatchFromPlayerId.returns(mockMatch);

        const module: TestingModule = await Test.createTestingModule({
            providers: [MatchGateway, { provide: MatchService, useValue: mockMatchService }, { provide: Server, useValue: mockServer }],
        }).compile();

        gateway = module.get<MatchGateway>(MatchGateway);

        gateway['server'] = {
            to: () => ({ emit: emitStub }),
            sockets: { sockets: { get: () => mockSocket } },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 'any' used to mock a partial Server object
        } as any;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should call create match on create match event', () => {
        const mockGameData = structuredClone(MOCK_GAME_DATAS[0]);
        gateway.createMatch(mockSocket, mockGameData);
        expect(mockMatchService.createMatch.calledWith(mockSocket.id, mockGameData)).toBeTruthy();
    });

    it('should call join match on join match event', () => {
        const matchCode = '1234';
        gateway.joinMatch(mockSocket, matchCode);
        expect(mockMatchService.joinMatch.calledWith(mockSocket.id, matchCode)).toBeTruthy();
    });

    it('should call leave match on leave match event', () => {
        gateway.leaveMatch(mockSocket);
        expect(mockMatchService.leaveMatch.calledWith(mockSocket.id)).toBeTruthy();
    });

    it('should call leave match on handle disconnect', () => {
        gateway.handleDisconnect(mockSocket);
        expect(mockMatchService.leaveMatch.called).toBeTruthy();
    });

    it('should connect player to match', () => {
        const playerId = 'player1';
        const matchCode = '1234';
        gateway.connectPlayer(playerId, matchCode);
        expect(mockSocket.join.calledWith(matchCode)).toBeTruthy();
    });

    it('should disconnect player from match', () => {
        const playerId = 'player1';
        const matchCode = '1234';
        Object.defineProperty(mockSocket, 'rooms', {
            writable: true,
            value: [matchCode],
        });
        gateway.disconnectPlayer(playerId);
        expect(mockSocket.leave.calledWith(matchCode)).toBeTruthy();
    });

    it('should emit update', () => {
        const matchCode = '1234';
        const matchData = structuredClone(MOCK_MATCH_DATAS[0]);
        gateway.emitUpdate(matchCode, matchData);
        expect(emitStub.calledWith(MatchEvent.Update, matchData)).toBeTruthy();
    });

    it('should emit message to socket', () => {
        const matchCode = '1234';
        const message = 'hello';
        const hasCloseButton = false;
        const expectedPayload = {
            message,
            hasCloseButton,
        };

        gateway.emitMessage(matchCode, message);

        expect(mockSocket.emit.calledWith(MatchEvent.Message, expectedPayload)).toBeTruthy();
    });

    it('should emit message to room', () => {
        const matchCode = '1234';
        const message = 'hello';
        const hasCloseButton = false;
        const expectedPayload = {
            message,
            hasCloseButton,
        };

        mockSocket = null;

        gateway.emitMessage(matchCode, message, hasCloseButton);

        expect(emitStub.calledWith(MatchEvent.Message, expectedPayload)).toBeTruthy();
    });

    it('should emit removed from match', () => {
        const matchCode = '1234';
        const reason = 'hello';
        gateway.emitRemovedFromMatch(matchCode, reason);
        expect(mockSocket.emit.calledWith(MatchEvent.RemovedFromMatch, reason)).toBeTruthy();
    });

    it('should emit message with close button', () => {
        const matchCode = '1234';
        const message = 'hello';
        const hasCloseButton = true;
        const expectedPayload = {
            message,
            hasCloseButton,
        };

        gateway.emitMessage(matchCode, message, hasCloseButton);

        expect(mockSocket.emit.calledWith(MatchEvent.Message, expectedPayload)).toBeTruthy();
    });
});
