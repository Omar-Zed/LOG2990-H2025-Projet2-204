/* eslint-disable max-lines */
// Tests surpasses the maximum lines limit by 30
import { Match } from '@app/classes/match/match';
import { ChatService } from '@app/services/chat/chat.service';
import { ItemService } from '@app/services/item/item.service';
import { MapService } from '@app/services/map/map.service';
import { PlayService } from '@app/services/play/play.service';
import { TrackingService } from '@app/services/tracking/tracking.service';
import {
    DEFAULT_ATTACK,
    DEFAULT_DEFENSE,
    DEFAULT_ESCAPE_CHANCES,
    DEFAULT_ESCAPES,
    ITEM1_ATTACK_BONUS,
    ITEM1_DEFENSE_BONUS,
    ITEM2_ATTACK_BONUS,
    ITEM2_DEFENSE_BONUS,
    ITEM3_BUSH_ATTACK_BONUS,
    ITEM5_ESCAPE_CHANCES_BONUS,
    ITEM5_MAX_ESCAPES_BONUS,
} from '@common/consts/combat-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { CombatAction, MatchState } from '@common/interfaces/match-data';
import { DiceType, PlayerType } from '@common/interfaces/player-data';
import { TileType } from '@common/interfaces/tile-type.enum';
import { MOCK_MATCH_DATAS, MOCK_PLAYER_COMBAT_DATAS } from '@common/test-consts/mock-matches';
import { MOCK_PLAYER_DATAS } from '@common/test-consts/mock-players';
import { Test, TestingModule } from '@nestjs/testing';
import { createSandbox, createStubInstance, SinonSandbox, SinonStubbedInstance } from 'sinon';
import { CombatService } from './combat.service';

describe('CombatService', () => {
    let service: CombatService;
    let sandbox: SinonSandbox;
    let mockMapService: SinonStubbedInstance<MapService>;
    let mockPlayService: SinonStubbedInstance<PlayService>;
    let mockChatService: SinonStubbedInstance<ChatService>;
    let mocktrackingService: SinonStubbedInstance<TrackingService>;
    let mockItemService: SinonStubbedInstance<ItemService>;
    let mockMatch: SinonStubbedInstance<Match>;

    beforeAll(async () => {
        sandbox = createSandbox();
        mockMapService = createStubInstance(MapService);
        mockPlayService = createStubInstance(PlayService);
        mockChatService = createStubInstance(ChatService);
        mockMatch = createStubInstance(Match);
        mockItemService = createStubInstance(ItemService);
        mocktrackingService = createStubInstance(TrackingService);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CombatService,
                { provide: PlayService, useValue: mockPlayService },
                { provide: ChatService, useValue: mockChatService },
                { provide: MapService, useValue: mockMapService },
                { provide: ItemService, useValue: mockItemService },
                { provide: TrackingService, useValue: mocktrackingService },
            ],
        }).compile();

        service = module.get<CombatService>(CombatService);
    });

    beforeEach(() => {
        mockMatch.data = structuredClone(MOCK_MATCH_DATAS[0]);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('attack should start animation if player can act', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'canPlayerAct').returns(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const startAttackAnimationStub = sandbox.stub(service as any, 'startAttackAnimation');

        service.attack(mockMatch, 'player1');

        expect(startAttackAnimationStub.calledWith(mockMatch)).toBe(true);
    });

    it('escape should start animation if player can act', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'canPlayerAct').returns(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const startEscapeAnimationStub = sandbox.stub(service as any, 'startEscapeAnimation');

        service.escape(mockMatch, 'player1');

        expect(startEscapeAnimationStub.calledWith(mockMatch)).toBe(true);
    });

    it('start combat should initialize combat data', () => {
        mockMatch.getPlayer.withArgs('player1').returns({ ...structuredClone(MOCK_PLAYER_DATAS[0]), speed: 5 });
        mockMatch.getPlayer.withArgs('player2').returns({ ...structuredClone(MOCK_PLAYER_DATAS[1]), speed: 6 });
        mockMatch.getPlayerIndex.withArgs('player1').returns(0);
        mockMatch.getPlayerIndex.withArgs('player2').returns(1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const startCombatWaitStub = sandbox.stub(service as any, 'startCombatWait');

        service.startCombat(mockMatch, 'player1', 'player2');

        expect(mockMatch.data.combatData.playersCombatData.length).toBe(2);
        expect(mockMatch.data.combatData.isSecondPlayerTurn).toBe(true);
        expect(startCombatWaitStub.calledWith(mockMatch)).toBe(true);
    });

    it('start combat end death should continue turn', () => {
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), playerIndex: 0 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), playerIndex: 1 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = true;
        mockMatch.data.playData.activePlayerIndex = 0;

        service.startCombatEndDeath(mockMatch);

        expect(mockMatch.data.state).toBe(MatchState.CombatEnd);
        expect(mockMatch.setTimeout.called).toBe(true);
    });

    it('start combat end death should continue turn with two bots in combat', () => {
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), playerIndex: 0 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), playerIndex: 1 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = true;
        mockMatch.data.playData.activePlayerIndex = 0;
        mockMatch.data.players[0].type = PlayerType.BotAggressive;
        mockMatch.data.players[1].type = PlayerType.BotAggressive;

        service.startCombatEndDeath(mockMatch);

        expect(mockMatch.data.state).toBe(MatchState.CombatEnd);
        expect(mockMatch.setTimeout.called).toBe(true);
    });

    it('start combat end death should handle active player death', () => {
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), playerIndex: 0 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), playerIndex: 1 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = true;
        mockMatch.data.playData.activePlayerIndex = 1;

        service.startCombatEndDeath(mockMatch);

        expect(mockMatch.data.state).toBe(MatchState.CombatEnd);
        expect(mockMatch.setTimeout.called).toBe(true);
    });

    it('can player act should return false when not in combat', () => {
        mockMatch.getPlayerIndex.returns(0);
        mockMatch.data.combatData.isSecondPlayerTurn = false;
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), playerIndex: 0 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), playerIndex: 1 },
        ];
        mockMatch.isState.withArgs([MatchState.CombatWait]).returns(true);

        const result = service['canPlayerAct'](mockMatch, 'player1');

        expect(result).toBe(true);
    });

    it('can player act should return true for active second player', () => {
        mockMatch.getPlayerIndex.returns(1);
        mockMatch.data.combatData.isSecondPlayerTurn = true;
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), playerIndex: 0 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), playerIndex: 1 },
        ];
        mockMatch.isState.withArgs([MatchState.CombatWait]).returns(false);

        const result = service['canPlayerAct'](mockMatch, 'player1');

        expect(result).toBe(false);
    });

    it('start combat wait should set state and timeout', () => {
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), currentEscapes: 1 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), currentEscapes: 0 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const computeHealingItemStub = sandbox.stub(service as any, 'computeHealingItem');

        service['startCombatWait'](mockMatch);

        expect(mockMatch.data.state).toBe(MatchState.CombatWait);
        expect(mockMatch.sendUpdate.called).toBe(true);
        expect(mockMatch.setTimeout.called).toBe(true);
        expect(computeHealingItemStub.calledWith(mockMatch)).toBe(true);
    });

    it('start combat wait should have reduced time when no escape', () => {
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), currentEscapes: 1 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), currentEscapes: 0 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = true;

        service['startCombatWait'](mockMatch);

        expect(mockMatch.data.state).toBe(MatchState.CombatWait);
        expect(mockMatch.sendUpdate.called).toBe(true);
        expect(mockMatch.setTimeout.called).toBe(true);
    });

    it('start attack animation should execute attack', () => {
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), currentHealth: 10 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), currentHealth: 5 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'executeAttack');

        service['startAttackAnimation'](mockMatch);

        expect(mockMatch.data.state).toBe(MatchState.CombatAnimation);
        expect(mockMatch.data.combatData.isSecondPlayerTurn).toBe(true);
        expect(mockMatch.setTimeout.called).toBe(true);
    });

    it('start attack animation should kill player', () => {
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), currentHealth: 10 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), currentHealth: 5 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'executeAttack');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'getActivePlayerData').returns({ ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), currentHealth: -2 });

        service['startAttackAnimation'](mockMatch);

        expect(mockMatch.data.state).toBe(MatchState.CombatAnimation);
        expect(mockMatch.data.combatData.isSecondPlayerTurn).toBe(true);
        expect(mockMatch.setTimeout.called).toBe(true);
    });

    it('start escape animation should execute escape success', () => {
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), currentEscapes: 1 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), currentEscapes: 0 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'executeEscape').returns(true);

        service['startEscapeAnimation'](mockMatch);

        expect(mockMatch.data.state).toBe(MatchState.CombatAnimation);
        expect(mockMatch.data.combatData.lastCombatAction).toBe(CombatAction.SuccessEscape);
        expect(mockMatch.setTimeout.called).toBe(true);
    });

    it('start escape animation should handle escape failure', () => {
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), currentEscapes: 1 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), currentEscapes: 0 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'executeEscape').returns(false);

        service['startEscapeAnimation'](mockMatch);

        expect(mockMatch.data.combatData.lastCombatAction).toBe(CombatAction.FailEscape);
        expect(mockMatch.setTimeout.called).toBe(true);
    });

    it('start combat end escape should set state', () => {
        service['startCombatEndEscape'](mockMatch);

        expect(mockMatch.data.state).toBe(MatchState.CombatEnd);
    });

    it('execute escape should succeed if conditions met', () => {
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), currentEscapes: 1 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), currentEscapes: 0 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = false;
        const randomNumber = 0.1;
        sandbox.stub(Math, 'random').returns(randomNumber);

        const result = service['executeEscape'](mockMatch);

        expect(result).toBe(true);
        expect(mockMatch.data.combatData.playersCombatData[0].currentEscapes).toBe(0);
    });

    it('execute attack should update health', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const computeAttackResultStub = sandbox.stub(service as any, 'computeAttackResult');

        const attackResult1 = 3;
        computeAttackResultStub.returns(attackResult1);
        service['executeAttack'](mockMatch);
        expect(mockMatch.data.combatData.lastCombatAction).toBe(CombatAction.SuccessAttack);

        const attackResult2 = 0;
        computeAttackResultStub.returns(attackResult2);
        service['executeAttack'](mockMatch);
        expect(mockMatch.data.combatData.lastCombatAction).toBe(CombatAction.FailAttack);
    });

    it('compute attack result should calculate damage', () => {
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), attack: 2 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), defense: 1 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = false;
        const attackRoll = 4;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'rollAttack').returns(attackRoll);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'rollDefense').returns(2);

        const result = service['computeAttackResult'](mockMatch);

        const expectedResult = 3; // 4 + 2 - 2 - 1
        expect(result).toBe(expectedResult);
        expect(mockMatch.data.combatData.lastRolledAttack).toBe(attackRoll);
    });

    it('roll attack should roll random if not debug', () => {
        mockMatch.data.playData.isDebugMode = false;
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), playerIndex: 0 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), playerIndex: 1 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = false;
        mockMatch.data.players[1].attackDice = DiceType.D6;
        const randomNumber = 0.5;
        sandbox.stub(Math, 'random').returns(randomNumber);

        const result = service['rollAttack'](mockMatch);

        const expectedResult = 4;
        expect(result).toBe(expectedResult);
    });

    it('roll defense should roll random if not debug', () => {
        mockMatch.data.playData.isDebugMode = false;
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), playerIndex: 0 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), playerIndex: 1 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = false;
        mockMatch.data.players[1].attackDice = DiceType.D6;
        const randomNumber = 0.5;
        sandbox.stub(Math, 'random').returns(randomNumber);

        const result = service['rollDefense'](mockMatch);

        const expectedResult = 3;
        expect(result).toBe(expectedResult);
    });

    it('get active and inactive player data should return correct players', () => {
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), playerIndex: 0 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), playerIndex: 1 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = true;

        const activePlayer = service['getActivePlayerData'](mockMatch);
        expect(activePlayer.playerIndex).toBe(1);

        const inactivePlayer = service['getInactivePlayerData'](mockMatch);
        expect(inactivePlayer.playerIndex).toBe(0);

        expect(service.getCombatPlayerNames(mockMatch)).toEqual(['Player2', 'Player1']);
    });

    it('compute player data should initialize combat data', () => {
        mockMatch.getPlayer.returns({ ...structuredClone(MOCK_PLAYER_DATAS[0]), position: { x: 0, y: 0 } });
        mockMatch.getPlayerIndex.returns(0);
        mockMatch.data.gameData.mapData.tiles[0][0] = TileType.Grass;

        const result = service['computePlayerData'](mockMatch, 'player1');

        expect(result.playerIndex).toBe(0);
        expect(result.currentHealth).toBe(MOCK_PLAYER_DATAS[0].health);
    });

    it('apply combat buffs should modify stats for path', () => {
        const playerCombatData = { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), standingTile: TileType.Path, playerIndex: 0 };
        mockMatch.data.players[0].items = [ItemType.Item1];
        const result = service['applyCombatBuffs'](mockMatch, playerCombatData);

        expect(result.attack).toBeLessThanOrEqual(playerCombatData.attack);
        expect(result.defense).toBeLessThanOrEqual(playerCombatData.defense);
    });

    it('respawn player should move to empty tile if needed', () => {
        const player = { ...structuredClone(MOCK_PLAYER_DATAS[0]), spawnPoint: { x: 1, y: 1 }, position: { x: 0, y: 0 } };
        mockMapService.getNearestEmptyTile.returns({ x: 1, y: 1 });

        service['respawnPlayer'](mockMatch, player);

        expect(player.position).toEqual({ x: 1, y: 1 });
    });

    it('computeHealingItem should heal player when they have Item4 and health is below threshold', () => {
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), playerIndex: 0, currentHealth: 2 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), playerIndex: 1 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = false;
        mockMatch.data.players = [
            { ...structuredClone(MOCK_PLAYER_DATAS[0]), items: [ItemType.Item4], health: 10 },
            { ...structuredClone(MOCK_PLAYER_DATAS[1]) },
        ];
        const expectedhealth = mockMatch.data.combatData.playersCombatData[0].currentHealth + 1;
        service['computeHealingItem'](mockMatch);

        expect(mockMatch.data.combatData.playersCombatData[0].currentHealth).toBe(expectedhealth);
    });

    it('computeHealingItem should not heal player when they do not have Item4', () => {
        mockMatch.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), playerIndex: 0, currentHealth: 2 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), playerIndex: 1 },
        ];
        mockMatch.data.combatData.isSecondPlayerTurn = false;
        mockMatch.data.players = [
            { ...structuredClone(MOCK_PLAYER_DATAS[0]), items: [ItemType.Item1, ItemType.Item2], health: 10 },
            { ...structuredClone(MOCK_PLAYER_DATAS[1]) },
        ];

        service['computeHealingItem'](mockMatch);

        expect(mockMatch.data.combatData.playersCombatData[0].currentHealth).toBe(2);
    });

    it('applyCombatBuffs should apply correct buffs for all combat items', () => {
        const playerCombatData = {
            ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]),
            playerIndex: 0,
            attack: DEFAULT_ATTACK,
            defense: DEFAULT_DEFENSE,
            maxEscapes: DEFAULT_ESCAPES,
            currentEscapes: DEFAULT_ESCAPES,
            escapeChances: DEFAULT_ESCAPE_CHANCES,
            standingTile: TileType.Bush,
        };

        mockMatch.data.players = [
            {
                ...structuredClone(MOCK_PLAYER_DATAS[0]),
                items: [ItemType.Item1, ItemType.Item2, ItemType.Item3, ItemType.Item4, ItemType.Item5],
            },
            structuredClone(MOCK_PLAYER_DATAS[1]),
        ];

        const result = service['applyCombatBuffs'](mockMatch, playerCombatData);

        const expectedAttack = DEFAULT_ATTACK + ITEM1_ATTACK_BONUS + ITEM2_ATTACK_BONUS + ITEM3_BUSH_ATTACK_BONUS;
        const expectedDefense = DEFAULT_DEFENSE + ITEM1_DEFENSE_BONUS + ITEM2_DEFENSE_BONUS;
        const expectedMaxEscapes = DEFAULT_ESCAPES + ITEM5_MAX_ESCAPES_BONUS;
        const expectedCurrentEscapes = DEFAULT_ESCAPES + ITEM5_MAX_ESCAPES_BONUS;
        const expectedEscapeChances = DEFAULT_ESCAPE_CHANCES + ITEM5_ESCAPE_CHANCES_BONUS;

        expect(result.attack).toBe(expectedAttack);
        expect(result.defense).toBe(expectedDefense);
        expect(result.maxEscapes).toBe(expectedMaxEscapes);
        expect(result.currentEscapes).toBe(expectedCurrentEscapes);
        expect(result.escapeChances).toBe(expectedEscapeChances);
    });
});
