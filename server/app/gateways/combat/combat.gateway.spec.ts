import { Test, TestingModule } from '@nestjs/testing';
import { SinonStub, SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { MatchService } from '@app/services/match/match.service';
import { Match } from '@app/classes/match/match';
import { CombatGateway } from './combat.gateway';
import { CombatService } from '@app/services/combat/combat.service';

describe('CombatGateway', () => {
    let gateway: CombatGateway;
    let mockSocket: SinonStubbedInstance<Socket>;
    let mockServer: SinonStubbedInstance<Server>;
    let mockCombatService: SinonStubbedInstance<CombatService>;
    let mockMatchService: SinonStubbedInstance<MatchService>;
    let emitStub: SinonStub;
    let mockMatch: SinonStubbedInstance<Match>;

    beforeEach(async () => {
        mockSocket = createStubInstance<Socket>(Socket);
        mockCombatService = createStubInstance<CombatService>(CombatService);
        mockMatchService = createStubInstance<MatchService>(MatchService);
        mockServer = createStubInstance<Server>(Server);
        emitStub = stub();
        mockMatch = createStubInstance<Match>(Match);
        mockMatchService.getMatchFromPlayerId.returns(mockMatch);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CombatGateway,
                { provide: MatchService, useValue: mockMatchService },
                { provide: CombatService, useValue: mockCombatService },
                { provide: Server, useValue: mockServer },
            ],
        }).compile();

        gateway = module.get<CombatGateway>(CombatGateway);

        gateway['server'] = {
            to: () => ({ emit: emitStub }),
            sockets: { sockets: { get: () => mockSocket } },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 'any' used to mock a partial Server object
        } as any;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should call attack on attack event', () => {
        gateway.attack(mockSocket);
        expect(mockCombatService.attack.calledWith(mockMatch, mockSocket.id)).toBeTruthy();
    });

    it('should call escape on escape event', () => {
        gateway.escape(mockSocket);
        expect(mockCombatService.escape.calledWith(mockMatch, mockSocket.id)).toBeTruthy();
    });
});
