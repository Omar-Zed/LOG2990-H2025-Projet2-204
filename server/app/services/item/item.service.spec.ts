import { Match } from '@app/classes/match/match';
import { ChatService } from '@app/services/chat/chat.service';
import { MapService } from '@app/services/map/map.service';
import { PlayService } from '@app/services/play/play.service';
import { TrackingService } from '@app/services/tracking/tracking.service';
import { AVATAR_EVOLVED_SUFFIX, AVATAR_SHINY_SUFFIX, MAX_ITEMS } from '@common/consts/player-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { MatchState } from '@common/interfaces/match-data';
import { PlayerData } from '@common/interfaces/player-data';
import { Position } from '@common/interfaces/position';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { MOCK_PLAYER_DATAS } from '@common/test-consts/mock-players';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonSandbox, SinonStubbedInstance, createSandbox, createStubInstance } from 'sinon';
import { ItemService } from './item.service';

describe('ItemService', () => {
    let service: ItemService;
    let sandbox: SinonSandbox;
    let mockMapService: SinonStubbedInstance<MapService>;
    let mockPlayService: SinonStubbedInstance<PlayService>;
    let mockChatService: SinonStubbedInstance<ChatService>;
    let mockTrackingService: SinonStubbedInstance<TrackingService>;
    let mockMatch: SinonStubbedInstance<Match>;

    beforeAll(async () => {
        sandbox = createSandbox();
        mockMapService = createStubInstance(MapService);
        mockPlayService = createStubInstance(PlayService);
        mockChatService = createStubInstance(ChatService);
        mockTrackingService = createStubInstance(TrackingService);
        mockMatch = createStubInstance(Match);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ItemService,
                { provide: MapService, useValue: mockMapService },
                { provide: PlayService, useValue: mockPlayService },
                { provide: ChatService, useValue: mockChatService },
                { provide: TrackingService, useValue: mockTrackingService },
            ],
        }).compile();

        service = module.get<ItemService>(ItemService);
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

    it('dropItems should remove items from player and add them to map', () => {
        const playerId = 'player1';
        const itemToDrop = ItemType.Item3;
        const playerPosition = { x: 5, y: 5 };
        const dropPosition = { x: 6, y: 5 };

        const player = {
            ...structuredClone(MOCK_PLAYER_DATAS[0]),
            id: playerId,
            items: [itemToDrop, ItemType.Item1],
            position: playerPosition,
        };
        mockMatch.getPlayer.withArgs(playerId).returns(player);

        mockMatch.data.gameData.mapData.items = {
            [ItemType.Item1]: [],
            [ItemType.Item2]: [],
            [ItemType.Item3]: [],
        } as Record<ItemType, Position[]>;

        mockMapService.getNearestItemDropSpot.returns(dropPosition);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const computeItemsSpy = sandbox.spy(service as any, 'computeItems');

        service.dropItems(mockMatch, playerId, [itemToDrop]);

        expect(mockMapService.getNearestItemDropSpot.calledWith(mockMatch.data, playerPosition)).toBe(true);
        expect(mockMatch.data.gameData.mapData.items[itemToDrop]).toContain(dropPosition);
        expect(player.items).not.toContain(itemToDrop);
        expect(player.items).toContain(ItemType.Item1);
        expect(computeItemsSpy.calledWith(player)).toBe(true);
    });

    it('checkAndPickupItem should pick up item when player is on item position', () => {
        const playerData = {
            ...structuredClone(MOCK_PLAYER_DATAS[0]),
            position: { x: 1, y: 1 },
        };
        const itemType = ItemType.Item3;

        mockMapService.getItemTypeAtPosition.returns(itemType);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const handleItemAdditionSpy = sandbox.spy(service as any, 'handleItemAddition');

        service['checkAndPickupItem'](mockMatch, playerData);

        expect(mockMapService.getItemTypeAtPosition.calledWith(mockMatch.data, playerData.position)).toBe(true);
        expect(handleItemAdditionSpy.calledWith(mockMatch, playerData, itemType)).toBe(true);
    });

    it('handleItemAddition should add item to player inventory and remove from map', () => {
        const playerData = {
            ...structuredClone(MOCK_PLAYER_DATAS[0]),
            items: [ItemType.Item1],
            position: { x: 2, y: 2 },
        };
        const itemType = ItemType.Item3;
        mockMatch.data.gameData.mapData.items = {
            [ItemType.Item3]: [
                { x: 2, y: 2 },
                { x: 3, y: 3 },
            ],
        } as Record<ItemType, Position[]>;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const computeItemsSpy = sandbox.spy(service as any, 'computeItems');

        service['handleItemAddition'](mockMatch, playerData, itemType);

        expect(playerData.items).toContain(itemType);
        expect(mockMatch.data.gameData.mapData.items[itemType]).toEqual([{ x: 3, y: 3 }]);
        expect(computeItemsSpy.calledWith(playerData)).toBe(true);
        expect(mockMatch.data.state).not.toBe(MatchState.ItemWait);
    });

    it('handleItemAddition should change state to ItemWait when exceeding MAX_ITEMS', () => {
        const playerData = {
            ...structuredClone(MOCK_PLAYER_DATAS[0]),
            items: new Array(MAX_ITEMS).fill(ItemType.Item1),
            position: { x: 2, y: 2 },
        };
        const itemType = ItemType.Item3;
        mockMatch.data.gameData.mapData.items = {
            [ItemType.Item3]: [{ x: 2, y: 2 }],
        } as Record<ItemType, Position[]>;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const computeItemsSpy = sandbox.spy(service as any, 'computeItems');

        service['handleItemAddition'](mockMatch, playerData, itemType);

        expect(playerData.items).toContain(itemType);
        expect(mockMatch.data.gameData.mapData.items[itemType]).toEqual([]);
        expect(computeItemsSpy.called).toBe(false);
        expect(mockMatch.data.state).toBe(MatchState.ItemWait);
    });

    it('forceItemDrop should drop excess item and continue turn', () => {
        const playerId = 'player1';
        const excessItem = ItemType.Item3;

        const playerItems = new Array(MAX_ITEMS + 1).fill(ItemType.Item1);
        playerItems[MAX_ITEMS] = excessItem;

        const player = {
            ...structuredClone(MOCK_PLAYER_DATAS[0]),
            id: playerId,
            items: playerItems,
        };

        mockMatch.getPlayer.withArgs(playerId).returns(player);

        const dropItemsSpy = sandbox.spy(service, 'dropItems');

        service['forceItemDrop'](mockMatch, playerId);

        expect(mockMatch.data.state).toBe(MatchState.TurnWait);
        expect(dropItemsSpy.calledWith(mockMatch, playerId, [excessItem])).toBe(true);
    });

    it('computeItems should update player avatar based on items', () => {
        const baseAvatar = 'avatar1';

        const player1 = {
            ...structuredClone(MOCK_PLAYER_DATAS[0]),
            avatar: baseAvatar,
            items: [],
        };

        service['computeItems'](player1 as PlayerData);
        expect(player1.avatar).toBe(baseAvatar);

        const player2 = {
            ...structuredClone(MOCK_PLAYER_DATAS[0]),
            avatar: baseAvatar,
            items: [ItemType.Item1],
        };

        service['computeItems'](player2 as PlayerData);
        expect(player2.avatar).toBe(baseAvatar + AVATAR_SHINY_SUFFIX);

        const player3 = {
            ...structuredClone(MOCK_PLAYER_DATAS[0]),
            avatar: baseAvatar,
            items: [ItemType.Item2],
        };

        service['computeItems'](player3 as PlayerData);
        expect(player3.avatar).toBe(baseAvatar + AVATAR_EVOLVED_SUFFIX);

        const player4 = {
            ...structuredClone(MOCK_PLAYER_DATAS[0]),
            avatar: baseAvatar,
            items: [ItemType.Item1, ItemType.Item2],
        };

        service['computeItems'](player4 as PlayerData);
        expect(player4.avatar).toBe(baseAvatar + AVATAR_EVOLVED_SUFFIX + AVATAR_SHINY_SUFFIX);
    });

    it('computeItems should not modify avatar when format is not standard', () => {
        const nonStandardAvatar = 'custom_avatar';

        const player = {
            ...structuredClone(MOCK_PLAYER_DATAS[0]),
            avatar: nonStandardAvatar,
            items: [ItemType.Item1, ItemType.Item2],
        };

        service['computeItems'](player as PlayerData);

        expect(player.avatar).toBe(nonStandardAvatar);
    });
});
