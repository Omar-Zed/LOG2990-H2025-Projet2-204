import { Match } from '@app/classes/match/match';
import { ChatService } from '@app/services/chat/chat.service';
import { MatchService } from '@app/services/match/match.service';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStub, SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';

describe('LobbyGateway', () => {
    let gateway: ChatGateway;
    let mockSocket: SinonStubbedInstance<Socket>;
    let mockServer: SinonStubbedInstance<Server>;
    let mockChatService: SinonStubbedInstance<ChatService>;
    let mockMatchService: SinonStubbedInstance<MatchService>;
    let emitStub: SinonStub;
    let mockMatch: SinonStubbedInstance<Match>;

    beforeEach(async () => {
        mockSocket = createStubInstance<Socket>(Socket);
        mockChatService = createStubInstance<ChatService>(ChatService);
        mockMatchService = createStubInstance<MatchService>(MatchService);
        mockServer = createStubInstance<Server>(Server);
        emitStub = stub();
        mockMatch = createStubInstance<Match>(Match);
        mockMatchService.getMatchFromPlayerId.returns(mockMatch);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatGateway,
                { provide: MatchService, useValue: mockMatchService },
                { provide: ChatService, useValue: mockChatService },
                { provide: Server, useValue: mockServer },
            ],
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);

        gateway['server'] = {
            to: () => ({ emit: emitStub }),
            sockets: { sockets: { get: () => mockSocket } },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 'any' used to mock a partial Server object
        } as any;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should handle new message successfully', () => {
        const testMessage = 'Hello world';

        gateway.message(mockSocket, testMessage);

        expect(mockMatchService.getMatchFromPlayerId.calledWith(mockSocket.id)).toBe(true);
        expect(mockChatService.message.calledWith(mockMatch, mockSocket.id, testMessage)).toBe(true);
    });
});
