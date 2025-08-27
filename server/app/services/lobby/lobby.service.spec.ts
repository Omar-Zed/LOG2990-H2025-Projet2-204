import { Match } from '@app/classes/match/match';
import { BotService } from '@app/services/bot/bot.service';
import { MatchService } from '@app/services/match/match.service';
import { PlayService } from '@app/services/play/play.service';
import { TrackingService } from '@app/services/tracking/tracking.service';
import { REGULAR_ITEMS } from '@common/consts/map-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { GameMode } from '@common/interfaces/map-data';
import { Message } from '@common/interfaces/message.enum';
import { Avatar, PlayerType } from '@common/interfaces/player-data';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { MOCK_PLAYER_DATAS } from '@common/test-consts/mock-players';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonSandbox, SinonStubbedInstance, createSandbox, createStubInstance } from 'sinon';
import { LobbyService } from './lobby.service';

describe('LobbyService', () => {
    let service: LobbyService;
    let sandbox: SinonSandbox;
    let mockPlayService: SinonStubbedInstance<PlayService>;
    let mockMatchService: SinonStubbedInstance<MatchService>;
    let mockBotService: SinonStubbedInstance<BotService>;
    let mockMatch: SinonStubbedInstance<Match>;
    let mocktrackingService: SinonStubbedInstance<TrackingService>;

    beforeAll(async () => {
        sandbox = createSandbox();
        mockPlayService = createStubInstance<PlayService>(PlayService);
        mockMatchService = createStubInstance<MatchService>(MatchService);
        mockBotService = createStubInstance<BotService>(BotService);
        mockMatch = createStubInstance<Match>(Match);
        mocktrackingService = createStubInstance<TrackingService>(TrackingService);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LobbyService,
                { provide: PlayService, useValue: mockPlayService },
                { provide: MatchService, useValue: mockMatchService },
                { provide: BotService, useValue: mockBotService },
                { provide: TrackingService, useValue: mocktrackingService },
            ],
        }).compile();

        service = module.get<LobbyService>(LobbyService);
    });

    beforeEach(() => {
        mockMatch = createStubInstance<Match>(Match);
        mockMatch.data = structuredClone(MOCK_MATCH_DATAS[1]);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should kick player if host and not kicking themselves', () => {
        const playerId = 'playerId';
        const targetId = 'targetId';
        mockMatch.isHost.returns(true);

        service.kickPlayer(mockMatch, playerId, targetId);

        expect(mockMatch.kickPlayer.calledWith(targetId, Message.Kick)).toBeTruthy();
        expect(mockMatch.sendUpdate.calledOnce).toBeTruthy();
    });

    it('should change player avatar and send update', () => {
        const player = structuredClone(MOCK_PLAYER_DATAS[0]);
        mockMatch.getPlayer.returns(player);

        service.changeAvatar(mockMatch, player.id, Avatar.Avatar11);

        expect(player.avatar).toBe(Avatar.Avatar11);
    });

    it('should change is connected on join lobby', () => {
        const player = structuredClone(MOCK_PLAYER_DATAS[0]);

        service.joinLobby(mockMatch, player.id, player);

        expect(player.isConnected).toBe(true);
    });

    it('should change lock status if host', () => {
        const playerId = 'playerId';
        mockMatch.isHost.returns(true);

        service.changeLockStatus(mockMatch, playerId, true);

        expect(mockMatch.changeLockStatus.calledWith(true)).toBeTruthy();
    });

    it('should start match if conditions are met', () => {
        const playerId = 'playerId';
        mockMatch.isHost.returns(true);
        mockMatch.isState.returns(true);
        mockMatch.data.lobbyData.isLocked = true;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const startMatchFirstTurnStub = sandbox.stub(service as any, 'startMatchFirstTurn');
        service.startMatch(mockMatch, playerId);

        expect(startMatchFirstTurnStub.called).toBeTruthy();
    });

    it('should noy start match if conditions are noy met', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const startMatchFirstTurnStub = sandbox.stub(service as any, 'startMatchFirstTurn');
        mockMatch.isHost.returns(true);
        mockMatch.isState.returns(true);
        mockMatch.data.lobbyData.isLocked = true;
        mockMatch.data.players.push(structuredClone(MOCK_PLAYER_DATAS[0]));
        mockMatch.data.gameData.mapData.gameMode = GameMode.CTF;

        service.startMatch(mockMatch, 'playerId');
        mockMatch.data.lobbyData.isLocked = false;
        service.startMatch(mockMatch, 'playerId');
        mockMatch.data.players = [structuredClone(MOCK_PLAYER_DATAS[0])];
        service.startMatch(mockMatch, 'playerId');

        expect(startMatchFirstTurnStub.called).toBeFalsy();
    });

    it('start match first turn should call start next turn', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const sortPlayersStub = sandbox.stub(service as any, 'sortPlayers');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const assignSpawnPointsStub = sandbox.stub(service as any, 'assignSpawnPoints');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const setupRandomItemsStub = sandbox.stub(service as any, 'setupRandomItems');
        mockMatch.data.gameData.mapData.gameMode = GameMode.CTF;

        service['startMatchFirstTurn'](mockMatch);

        expect(mocktrackingService.startTrackingMatch.calledWith(mockMatch)).toBeTruthy();
        expect(sortPlayersStub.calledWith(mockMatch)).toBeTruthy();
        expect(assignSpawnPointsStub.calledWith(mockMatch)).toBeTruthy();
        expect(setupRandomItemsStub.calledWith(mockMatch)).toBeTruthy();
        expect(mockMatch.data.playData.activePlayerIndex).toBe(-1);
        expect(mockPlayService.startNextTurn.calledWith(mockMatch)).toBeTruthy();
    });

    it('sort players should sort players by speed', () => {
        mockMatch.data.players = [
            { ...structuredClone(MOCK_PLAYER_DATAS[0]), speed: 1 },
            { ...structuredClone(MOCK_PLAYER_DATAS[1]), speed: 2 },
            { ...structuredClone(MOCK_PLAYER_DATAS[2]), speed: 0 },
            { ...structuredClone(MOCK_PLAYER_DATAS[3]), speed: 0 },
        ];
        mockMatch.getPlayerIndex.returns(1);

        service['sortPlayers'](mockMatch);

        expect(mockMatch.data.players[0].speed).toBe(2);
        expect(mockMatch.data.players[1].speed).toBe(1);
        expect(mockMatch.data.players[2].speed).toBe(0);
    });

    it('assign spawn points should assign spawn points to players', () => {
        mockMatch.data.players = [structuredClone(MOCK_PLAYER_DATAS[0]), structuredClone(MOCK_PLAYER_DATAS[1])];
        mockMatch.data.gameData.mapData.items.Spawn = [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 2 },
        ];

        service['assignSpawnPoints'](mockMatch);

        expect(mockMatch.data.players[0].spawnPoint).toBeDefined();
        expect(mockMatch.data.players[0].position).toEqual(mockMatch.data.players[0].spawnPoint);
        expect(mockMatch.data.players[1].spawnPoint).toBeDefined();
        expect(mockMatch.data.players[1].position).toEqual(mockMatch.data.players[1].spawnPoint);
    });

    it('get unique name should return original name if unique or append suffix', () => {
        mockMatch.data.players = [{ ...structuredClone(MOCK_PLAYER_DATAS[0]), name: 'Alice', id: 'player1' }];

        const uniqueName1 = service['getUniqueName'](mockMatch, 'player2', 'Bob');
        expect(uniqueName1).toBe('Bob');

        const uniqueName2 = service['getUniqueName'](mockMatch, 'player2', 'Alice');
        expect(uniqueName2).toBe('Alice-2');
    });

    it('setupRandomItems should distribute random items to unused item types', () => {
        const randomPosition1 = { x: 3, y: 3 };
        const randomPosition2 = { x: 4, y: 4 };

        mockMatch.data.gameData.mapData.items = {
            [ItemType.Random]: [randomPosition1, randomPosition2],
            [ItemType.Item1]: [],
            [ItemType.Item2]: [{ x: 0, y: 0 }],
            [ItemType.Item3]: [],
            [ItemType.Item4]: [],
            [ItemType.Item5]: [],
            [ItemType.Item6]: [],
            [ItemType.Spawn]: [],
            [ItemType.Flag]: [],
        } as Record<ItemType, { x: number; y: number }[]>;

        service['setupRandomItems'](mockMatch);

        expect(mockMatch.data.gameData.mapData.items[ItemType.Random].length).toBe(0);

        const totalDistributed = Object.values(REGULAR_ITEMS)
            .filter((itemType) => itemType !== ItemType.Random)
            .reduce((count, itemType) => {
                return count + mockMatch.data.gameData.mapData.items[itemType].length;
            }, 0);

        // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Number of items distributed
        expect(totalDistributed).toBe(3);

        const randomItemsCount = Object.values(REGULAR_ITEMS)
            .filter((itemType) => itemType === ItemType.Random)
            .reduce((count, itemType) => {
                return count + mockMatch.data.gameData.mapData.items[itemType].length;
            }, 0);

        expect(randomItemsCount).toBe(0);
    });

    it('should change lock status to true when adding a bot makes the match full', () => {
        mockMatch.isFull.onCall(0).returns(false);
        mockMatch.isFull.onCall(1).returns(true);
        mockBotService.getBotData.returns(structuredClone(MOCK_PLAYER_DATAS[0]));

        service.addBot(mockMatch, PlayerType.BotAggressive);
        expect(mockMatchService.addPlayerToMatchCode.called).toBeTruthy();
        expect(mockMatch.changeLockStatus.calledWith(true)).toBeTruthy();
        expect(mockMatch.sendUpdate.called).toBeTruthy();
    });
});
