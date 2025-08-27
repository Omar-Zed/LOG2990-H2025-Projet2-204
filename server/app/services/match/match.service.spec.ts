import { Match } from '@app/classes/match/match';
import { MatchGateway } from '@app/gateways/match/match.gateway';
import { BotService } from '@app/services/bot/bot.service';
import { ChatService } from '@app/services/chat/chat.service';
import { CombatService } from '@app/services/combat/combat.service';
import { GameService } from '@app/services/game/game.service';
import { PlayService } from '@app/services/play/play.service';
import { MATCH_CODE_LENGTH } from '@common/consts/match-data.const';
import { Message } from '@common/interfaces/message.enum';
import { PlayerType } from '@common/interfaces/player-data';
import { MOCK_GAME_DATAS } from '@common/test-consts/mock-games';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { MOCK_PLAYER_DATAS } from '@common/test-consts/mock-players';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonSandbox, SinonStubbedInstance, createSandbox, createStubInstance } from 'sinon';
import { MatchService } from './match.service';

describe('MatchService', () => {
    let service: MatchService;
    let sandbox: SinonSandbox;
    let mockMatchGateway: SinonStubbedInstance<MatchGateway>;
    let mockCombatService: SinonStubbedInstance<CombatService>;
    let mockPlayService: SinonStubbedInstance<PlayService>;
    let mockBotService: SinonStubbedInstance<BotService>;
    let mockGameService: SinonStubbedInstance<GameService>;
    let mockChatService: SinonStubbedInstance<ChatService>;
    let mockMatch: SinonStubbedInstance<Match>;

    beforeAll(async () => {
        sandbox = createSandbox();
        mockMatchGateway = createStubInstance<MatchGateway>(MatchGateway);
        mockCombatService = createStubInstance<CombatService>(CombatService);
        mockPlayService = createStubInstance<PlayService>(PlayService);
        mockBotService = createStubInstance<BotService>(BotService);
        mockChatService = createStubInstance<ChatService>(ChatService);
        mockMatch = createStubInstance<Match>(Match);
        mockGameService = createStubInstance<GameService>(GameService);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchService,
                { provide: MatchGateway, useValue: mockMatchGateway },
                { provide: PlayService, useValue: mockPlayService },
                { provide: CombatService, useValue: mockCombatService },
                { provide: BotService, useValue: mockBotService },
                { provide: ChatService, useValue: mockChatService },
                { provide: GameService, useValue: mockGameService },
            ],
        }).compile();

        service = module.get<MatchService>(MatchService);
    });

    beforeEach(() => {
        mockMatch.data = structuredClone(MOCK_MATCH_DATAS[0]);
        service['matches'] = new Map();
        service['playerToMatchCode'] = new Map();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('create match should create a new match and connect player', async () => {
        const playerId = 'player1';
        const matchCode = '1234';
        const gameData = structuredClone(MOCK_GAME_DATAS[0]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'canCreateMatch').returns(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'getNewMatchCode').returns('1234');

        const matchData = await service.createMatch(playerId, gameData);

        expect(matchData.code).toBe(matchCode);
        expect(matchData.gameData).toBe(gameData);
        expect(matchData.players[0].id).toBe(playerId);
        expect(mockMatchGateway.connectPlayer.calledWith(playerId, matchCode)).toBe(true);
    });

    it('send update should emit update via gateway', () => {
        service.sendUpdate(mockMatch);
        expect(mockMatchGateway.emitUpdate.calledWith(mockMatch.data.code, mockMatch.data)).toBe(true);
    });

    it('send message should emit message via gateway', () => {
        const matchCode = '1234';
        const message = 'Test message';
        service.sendMessage(matchCode, message);
        expect(mockMatchGateway.emitMessage.calledWith(matchCode, message)).toBe(true);
    });

    it('player removed from match should emit removal and disconnect player', () => {
        const playerId = 'player1';
        const reason = 'Kicked';
        service.playerRemovedFromMatch(playerId, reason);
        expect(mockMatchGateway.emitRemovedFromMatch.calledWith(playerId, reason)).toBe(true);
        expect(mockMatchGateway.disconnectPlayer.calledWith(playerId)).toBe(true);
    });

    it('join match should join player to match and connect them', () => {
        const playerId = 'player2';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'canJoinMatch').returns(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'getMatch').returns(mockMatch);

        const matchData = service.joinMatch(playerId, mockMatch.data.code);

        expect(mockMatch.join.calledWith(playerId)).toBe(true);
        expect(service['playerToMatchCode'].get(playerId)).toBe(mockMatch.data.code);
        expect(mockMatchGateway.connectPlayer.calledWith(playerId, mockMatch.data.code)).toBe(true);
        expect(matchData).toBe(mockMatch.data);
    });

    it('get match from player id should return the correct match', () => {
        const playerId = 'player1';
        service['playerToMatchCode'].set(playerId, mockMatch.data.code);
        service['matches'].set(mockMatch.data.code, mockMatch);

        const match = service.getMatchFromPlayerId(playerId);

        expect(match).toBe(mockMatch);
    });

    it('leave match should remove player and clean up if no players left', () => {
        const playerId = 'player1';
        const botPlayer = { ...structuredClone(MOCK_PLAYER_DATAS[0]), type: PlayerType.BotAggressive };
        mockMatch.data.players.push(botPlayer);
        mockMatch.getConnectedPlayerCount.returns(0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'getMatchFromPlayerId').returns(mockMatch);

        service.leaveMatch(playerId);

        expect(mockMatchGateway.disconnectPlayer.calledWith(playerId)).toBe(true);
        expect(mockMatch.clearTimeout.calledOnce).toBe(true);
    });

    it('should deactivate debug mode when host leaves and debug mode is active', () => {
        const hostPlayerId = 'hostPlayer';
        mockMatch.data.playData.isDebugMode = true;
        mockMatch.isHost.returns(true);
        mockMatch.getConnectedPlayerCount.returns(1);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'getMatchFromPlayerId').returns(mockMatch);

        service.leaveMatch(hostPlayerId);

        expect(mockPlayService.changeDebugMode.calledWith(mockMatch, hostPlayerId, false)).toBe(true);
        expect(mockMatchGateway.disconnectPlayer.calledWith(hostPlayerId)).toBe(true);
        expect(mockChatService.logPlayerLeft.calledWith(mockMatch, hostPlayerId)).toBe(true);
        expect(mockMatch.leave.calledWith(hostPlayerId)).toBe(true);
    });

    it('disconnect player should remove player from map and disconnect', () => {
        const playerId = 'player1';
        service['playerToMatchCode'].set(playerId, '1234');

        service['disconnectPlayer'](playerId);

        expect(service['playerToMatchCode'].has(playerId)).toBe(false);
        expect(mockMatchGateway.disconnectPlayer.calledWith(playerId)).toBe(true);
    });

    it('kill player combat should start combat end death', () => {
        service.killPlayerCombat(mockMatch);
        expect(mockCombatService.startCombatEndDeath.calledWith(mockMatch)).toBe(true);
    });

    it('respawn player combat should respawn player', () => {
        const playerData = structuredClone(MOCK_PLAYER_DATAS[0]);
        service.respawnPlayer(mockMatch, playerData);
        expect(mockCombatService.respawnPlayer.calledWith(mockMatch, playerData)).toBe(true);
    });

    it('start next turn should start next turn', () => {
        service.startNextTurn(mockMatch);
        expect(mockPlayService.startNextTurn.calledWith(mockMatch)).toBe(true);
    });

    it('can join match should return invalid match code', () => {
        const playerId = 'player1';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasMatchCode').returns(false);
        const canJoin = service['canJoinMatch'](playerId, mockMatch.data.code);
        expect(canJoin).toBe(false);
        expect(mockMatchGateway.emitMessage.calledWith(playerId, Message.InvalidMatchCode)).toBe(true);
    });

    it('can join match should return already in match', () => {
        const playerId = 'player1';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasMatchCode').returns(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasPlayerId').returns(true);
        const canJoin = service['canJoinMatch'](playerId, mockMatch.data.code);
        expect(canJoin).toBe(false);
        expect(mockMatchGateway.emitMessage.calledWith(playerId, Message.AlreadyInMatch)).toBe(true);
    });

    it('can join match should return room full', () => {
        const playerId = 'player1';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasMatchCode').returns(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasPlayerId').returns(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'isMatchFull').returns(true);
        const canJoin = service['canJoinMatch'](playerId, mockMatch.data.code);
        expect(canJoin).toBe(false);
        expect(mockMatchGateway.emitMessage.calledWith(playerId, Message.RoomFull)).toBe(true);
    });

    it('can join match should return room locked', () => {
        const playerId = 'player1';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasMatchCode').returns(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasPlayerId').returns(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'isMatchFull').returns(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'isMatchLocked').returns(true);
        const canJoin = service['canJoinMatch'](playerId, mockMatch.data.code);
        expect(canJoin).toBe(false);
        expect(mockMatchGateway.emitMessage.calledWith(playerId, Message.RoomLocked)).toBe(true);
    });

    it('can create match should return true if player is not in a match', async () => {
        const playerId = 'player1';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasPlayerId').returns(true);

        const canCreate = await service['canCreateMatch'](playerId, structuredClone(MOCK_GAME_DATAS[0]));

        expect(mockMatchGateway.emitMessage.calledWith(playerId, Message.AlreadyInMatch, true)).toBe(true);
        expect(canCreate).toBe(false);
    });

    it('can create match should return false if match does not exist', async () => {
        const playerId = 'player1';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasPlayerId').returns(false);
        mockGameService.findGame.returns(Promise.resolve(null));
        const canCreate = await service['canCreateMatch'](playerId, mockMatch.data.gameData);
        expect(mockMatchGateway.emitMessage.calledWith(playerId, Message.DeletedGame, true)).toBe(true);
        expect(canCreate).toBe(false);
    });

    it('can create match should return false if match is not visible ', async () => {
        const playerId = 'player1';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasPlayerId').returns(false);
        const invisibleGame = mockMatch.data.gameData;
        invisibleGame.isVisible = false;
        mockGameService.findGame.returns(Promise.resolve(invisibleGame));
        const canCreate = await service['canCreateMatch'](playerId, invisibleGame);
        expect(mockMatchGateway.emitMessage.calledWith(playerId, Message.InvisibleGame, true)).toBe(true);
        expect(canCreate).toBe(false);
    });

    it('can create match should return true if match is VALID ', async () => {
        const playerId = 'player1';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasPlayerId').returns(false);
        const game = mockMatch.data.gameData;
        mockGameService.findGame.returns(Promise.resolve(game));
        const canCreate = await service['canCreateMatch'](playerId, game);
        expect(canCreate).toBe(true);
    });

    it('is match full should return true if match is full', () => {
        mockMatch.isFull.returns(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'getMatch').returns(mockMatch);

        const isFull = service['isMatchFull'](mockMatch.data.code);

        expect(isFull).toBe(true);
    });

    it('is match locked should return true if match is locked', () => {
        mockMatch.data.lobbyData.isLocked = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'getMatch').returns(mockMatch);

        const isLocked = service['isMatchLocked'](mockMatch.data.code);

        expect(isLocked).toBe(true);
    });

    it('get match should return the match for the given code', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'getMatch').returns(mockMatch);

        const match = service['getMatch'](mockMatch.data.code);

        expect(match).toBe(mockMatch);
    });

    it('get match code should return the match code for the player', () => {
        const playerId = 'player1';
        const matchCode = '1234';
        service['playerToMatchCode'].set(playerId, matchCode);

        const code = service['getMatchCode'](playerId);

        expect(code).toBe(matchCode);
    });

    it('has match code should return true if match exists', () => {
        service['matches'].set(mockMatch.data.code, mockMatch);

        const hasCode = service['hasMatchCode'](mockMatch.data.code);

        expect(hasCode).toBe(true);
    });

    it('hasPlayerId should return true if player is in a match', () => {
        const playerId = 'player1';
        service['playerToMatchCode'].set(playerId, '1234');

        const hasPlayer = service['hasPlayerId'](playerId);

        expect(hasPlayer).toBe(true);
    });

    it('getNewMatchCode should generate a unique match code', () => {
        sandbox
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
            .stub(service as any, 'hasMatchCode')
            .onFirstCall()
            .returns(true)
            .onSecondCall()
            .returns(false);

        const matchCode = service['getNewMatchCode']();

        expect(matchCode).toBeDefined();
        expect(matchCode.length).toBe(MATCH_CODE_LENGTH);
    });
});
