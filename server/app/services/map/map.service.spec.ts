import { SURROUNDING_POSITIONS_PLUS } from '@common/consts/map-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { GameMode } from '@common/interfaces/map-data';
import { MatchData } from '@common/interfaces/match-data';
import { NeighborContext } from '@common/interfaces/movement';
import { PlayerData, Team } from '@common/interfaces/player-data';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonSandbox, createSandbox } from 'sinon';
import { MapService } from './map.service';

describe('MapService', () => {
    let service: MapService;
    let sandbox: SinonSandbox;
    let mockMatchData: MatchData;

    beforeAll(async () => {
        sandbox = createSandbox();
        const module: TestingModule = await Test.createTestingModule({
            providers: [MapService],
        }).compile();

        service = module.get<MapService>(MapService);
    });

    beforeEach(() => {
        mockMatchData = structuredClone(MOCK_MATCH_DATAS[0]);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('get possible moves should return possible moves', () => {
        mockMatchData.playData.activePlayerIndex = 0;
        mockMatchData.players[0].position = { x: 0, y: 0 };
        mockMatchData.playData.movementLeft = 2;

        const moves = service.getPossibleMoves(mockMatchData);

        expect(moves.length).toBeGreaterThan(0);
    });

    it('get shortest path should return path and cost', () => {
        mockMatchData.playData.activePlayerIndex = 0;
        mockMatchData.players[0].position = { x: 0, y: 0 };
        const target = { x: 1, y: 1 };

        const result = service.getShortestPath(mockMatchData, target);

        expect(result.moveCost).toBeDefined();
    });

    it('get shortest path should return null', () => {
        mockMatchData.playData.activePlayerIndex = 0;
        mockMatchData.players[0].position = { x: 1, y: 1 };
        const target = { x: 1, y: 1 };

        const result = service.getShortestPath(mockMatchData, target);

        expect(result.moveCost).toBeDefined();
    });

    it('get actions should return actions for bridges', () => {
        mockMatchData.playData.activePlayerIndex = 0;
        mockMatchData.players[0].position = { x: 1, y: 1 };
        mockMatchData.gameData.mapData.tiles[1][2] = TileType.Bridge;

        const actions = service.getActions(mockMatchData);

        expect(actions).toContainEqual({ x: 1, y: 2 });
    });

    it('get possible moves debug should return accessible tiles', () => {
        mockMatchData.gameData.mapData.tiles[0][1] = TileType.Grass;

        const moves = service.getPossibleMovesDebug(mockMatchData);

        expect(moves).toContainEqual({ x: 0, y: 1 });
    });

    it('get nearest empty tile should return nearest tile', () => {
        const currentPos = { x: 0, y: 0 };
        sandbox
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
            .stub(service as any, 'isTileValidForMovement')
            .onFirstCall()
            .returns(true)
            .onSecondCall()
            .returns(false);

        const result1 = service.getNearestEmptyTile(mockMatchData, currentPos);
        expect(result1).toEqual(currentPos);
        const result2 = service.getNearestEmptyTile(mockMatchData, currentPos);
        expect(result2).toEqual(currentPos);
    });

    it('get nearest empty tile should return position if out of bound', () => {
        const position = { x: -1, y: -1 };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'isOutOfBounds').returns(true);

        const result = service.getNearestEmptyTile(mockMatchData, position);
        expect(result).toEqual(position);
    });

    it('is tile valid for movement should return true if valid', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'isTileOccupiedByPlayer').returns(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'isTileAccessible').returns(true);

        const result = service['isTileValidForMovement'](mockMatchData, { x: 0, y: 0 });

        expect(result).toBe(true);
    });

    it('has enemy player should return true if enemy is on tile', () => {
        const position = { x: 3, y: 7 };
        mockMatchData.gameData.mapData.gameMode = GameMode.FFA;
        mockMatchData.players[0].position = position;

        const result = service['hasEnemyPlayer'](mockMatchData, position);

        expect(result).toBe(true);
    });

    it('enqueue valid neighbors should enqueue neighbors', () => {
        const size = mockMatchData.gameData.mapData.size;
        const visitedQueue = {
            visited: Array.from({ length: size }, () => Array(size).fill(false)),
            queue: [],
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'isOutOfBounds').returns(false);

        service['enqueueValidNeighbors'](mockMatchData, { x: 1, y: 1 }, visitedQueue);

        expect(visitedQueue.queue.length).toBe(SURROUNDING_POSITIONS_PLUS.length);
    });

    it('is tile a bridge should return true for bridge', () => {
        mockMatchData.gameData.mapData.tiles[0][0] = TileType.Bridge;
        mockMatchData.gameData.mapData.items.Item1 = [{ x: 0, y: 1 }];

        const result = service['hasActivatableBridge'](mockMatchData, { x: 0, y: 0 });

        expect(result).toBe(true);
    });

    it('get possible moves standard should return moves within range', () => {
        const size = mockMatchData.gameData.mapData.size;
        const distances = Array.from({ length: size }, () => Array(size).fill(Infinity));
        distances[0][0] = 0;
        distances[0][1] = 1;
        distances[1][0] = 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'calculateDistancesAndPredecessors').returns({ distances });

        const moves = service['getPossibleMovesStandard'](mockMatchData, { x: 0, y: 0 }, 1);

        expect(moves).toContainEqual({ x: 0, y: 1 });
    });

    it('get possible moves standard empty if out of bound', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'isOutOfBounds').returns(true);

        const result = service['getPossibleMovesStandard'](mockMatchData, { x: 0, y: 0 }, 1);

        expect(result).toEqual([]);
    });

    it('process neighbor should update distances and queue', () => {
        const context: NeighborContext = {
            pos: { x: 0, y: 0 },
            cost: 0,
            offset: { x: 0, y: 1 },
            maxCost: 10,
            matchData: mockMatchData,
            distances: [
                [0, Infinity],
                [Infinity, Infinity],
            ],
            predecessors: new Map(),
            queue: [],
            size: 0,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'isOutOfBounds').returns(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'isTileOccupiedByPlayer').returns(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'getMovementCost').returns(1);

        service['processNeighbor'](context);

        expect(context.distances[0][1]).toBe(1);
        expect(context.queue.length).toBe(1);
    });

    it('calculate distances and predecessors should calculate distances', () => {
        const result = service['calculateDistancesAndPredecessors'](mockMatchData, { x: 0, y: 0 }, 1);

        expect(result.distances[0][0]).toBe(0);
    });

    it('reconstruct path should return path', () => {
        const predecessors = new Map();
        predecessors.set({ x: 1, y: 0 }, { x: 0, y: 0 });

        const path = service['reconstructPath']({ x: 1, y: 0 }, predecessors);

        expect(path).toContainEqual({ x: 0, y: 0 });
    });

    it('is tile occupied by player should return true if occupied', () => {
        mockMatchData.players[0].position = { x: 0, y: 0 };

        const result = service['isTileOccupiedByPlayer'](mockMatchData, { x: 0, y: 0 });

        expect(result).toBe(true);
    });

    it('is tile occupied by object should return true if occupied', () => {
        mockMatchData.gameData.mapData.items.Spawn = [{ x: 0, y: 0 }];

        const result = service['isTileOccupiedByObject'](mockMatchData, { x: 0, y: 0 });

        expect(result).toBe(true);
    });

    it('is out of bounds should return true if out of bounds', () => {
        const result = service['isOutOfBounds'](mockMatchData, { x: -1, y: 0 });

        expect(result).toBe(true);
    });

    it('get movement cost should return tile cost', () => {
        mockMatchData.gameData.mapData.tiles[0][0] = TileType.Grass;

        const cost = service['getMovementCost'](mockMatchData, { x: 0, y: 0 });

        expect(cost).toBeDefined();
    });

    it('is tile accessible should return true if accessible', () => {
        mockMatchData.gameData.mapData.tiles[0][0] = TileType.Grass;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'isOutOfBounds').returns(false);

        const result = service['isTileAccessible'](mockMatchData, { x: 0, y: 0 });

        expect(result).toBe(true);
    });

    it('pos to key should convert position to key', () => {
        const key = service['posToKey']({ x: 1, y: 2 });

        expect(key).toBe('1-2');
    });

    it('key to pos should convert key to position', () => {
        const pos = service['keyToPos']('1-2');

        expect(pos).toEqual({ x: 1, y: 2 });
    });

    it('getNearestItemDropSpot should return current position if no items there', () => {
        const currentPos = { x: 0, y: 0 };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasNoItems').returns(true);

        const result = service.getNearestItemDropSpot(mockMatchData, currentPos);

        expect(result).toEqual(currentPos);
    });

    it('getNearestItemDropSpot should find nearest valid position for dropping items', () => {
        const currentPos = { x: 0, y: 0 };
        const validPos = { x: 1, y: 0 };

        sandbox
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
            .stub(service as any, 'hasNoItems')
            .onFirstCall()
            .returns(false)
            .onSecondCall()
            .returns(true);

        sandbox
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
            .stub(service as any, 'isValidForDrop')
            .onFirstCall()
            .returns(false)
            .onSecondCall()
            .returns(true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const enqueueStub = sandbox
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
            .stub(service as any, 'enqueueValidNeighbors')
            .callsFake((matchData, pos, visitedQueue: { queue: unknown[]; visited: boolean[][] }) => {
                visitedQueue.queue.push(validPos);
                visitedQueue.visited[validPos.x][validPos.y] = true;
            });

        const result = service.getNearestItemDropSpot(mockMatchData, currentPos);

        expect(result).toEqual(validPos);
        expect(enqueueStub.called).toBe(true);
    });

    it('getNearestItemDropSpot should return current position if no valid drops found', () => {
        const currentPos = { x: 0, y: 0 };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasNoItems').returns(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'isValidForDrop').returns(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'enqueueValidNeighbors').callsFake(() => {
            return;
        });

        const result = service.getNearestItemDropSpot(mockMatchData, currentPos);

        expect(result).toEqual(currentPos);
    });

    it('getItemTypeAtPosition should return item type at position or null', () => {
        const itemPosition = { x: 1, y: 2 };
        const emptyPosition = { x: 3, y: 4 };

        mockMatchData.gameData.mapData.items = {
            [ItemType.Item1]: [itemPosition],
            [ItemType.Item2]: [{ x: 5, y: 6 }],
            [ItemType.Spawn]: [{ x: 7, y: 8 }],
        } as Record<ItemType, Position[]>;

        const result1 = service.getItemTypeAtPosition(mockMatchData, itemPosition);
        expect(result1).toBe(ItemType.Item1);

        const result2 = service.getItemTypeAtPosition(mockMatchData, emptyPosition);
        expect(result2).toBe(null);
    });

    it('isValidForDrop should validate positions for item dropping correctly', () => {
        mockMatchData.gameData.mapData.tiles[0][0] = TileType.Grass;
        mockMatchData.gameData.mapData.tiles[1][1] = TileType.Water;
        mockMatchData.players = [{ position: { x: 2, y: 2 } }] as PlayerData[];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasNoItems').returns(true);
        const validResult = service['isValidForDrop'](mockMatchData, { x: 0, y: 0 });
        expect(validResult).toBe(true);

        const waterResult = service['isValidForDrop'](mockMatchData, { x: 1, y: 1 });
        expect(waterResult).toBe(false);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        (service as any).hasNoItems.restore();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'hasNoItems').returns(false);
        const withItemsResult = service['isValidForDrop'](mockMatchData, { x: 0, y: 0 });
        expect(withItemsResult).toBe(false);

        const withPlayerResult = service['isValidForDrop'](mockMatchData, { x: 2, y: 2 });
        expect(withPlayerResult).toBe(false);
    });

    it('hasNoItems should return true when position has no items', () => {
        const emptyPosition = { x: 1, y: 1 };
        const itemPosition = { x: 2, y: 2 };

        mockMatchData.gameData.mapData.items = {
            [ItemType.Item1]: [itemPosition],
            [ItemType.Item2]: [{ x: 3, y: 3 }],
        } as Record<ItemType, Position[]>;

        const resultEmpty = service['hasNoItems'](mockMatchData, emptyPosition);
        expect(resultEmpty).toBe(true);

        const resultWithItem = service['hasNoItems'](mockMatchData, itemPosition);
        expect(resultWithItem).toBe(false);
    });

    it('stopPathAtItemEncounter should handle empty path and truncate path at item encounters', () => {
        const emptyPath: Position[] = [];
        const emptyResult = service['stopPathAtItemEncounter'](emptyPath, mockMatchData);
        expect(emptyResult).toEqual([]);

        const path: Position[] = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 3, y: 0 },
        ];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'isTileOccupiedByObject').returns(false);
        const fullPathResult = service['stopPathAtItemEncounter'](path, mockMatchData);
        expect(fullPathResult).toEqual(path);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        (service as any).isTileOccupiedByObject.restore();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(service as any, 'isTileOccupiedByObject').callsFake((md: any, pos: Position) => pos.x === 2 && pos.y === 0);

        const truncatedResult = service['stopPathAtItemEncounter'](path, mockMatchData);
        expect(truncatedResult).toEqual([
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
        ]);
    });

    it('getActions in CTF mode should include opponent tiles and bridges, exclude teammate tiles', () => {
        mockMatchData.gameData.mapData.gameMode = GameMode.CTF;
        mockMatchData.playData.activePlayerIndex = 0;
        mockMatchData.players[0].position = { x: 1, y: 1 };
        mockMatchData.players[0].team = Team.Red;
        mockMatchData.players[1].position = { x: 1, y: 2 };
        mockMatchData.players[1].team = Team.Red;
        mockMatchData.players[2].position = { x: 1, y: 0 };
        mockMatchData.players[2].team = Team.Blue;
        mockMatchData.gameData.mapData.tiles = [
            [TileType.Grass, TileType.Grass, TileType.Grass],
            [TileType.Grass, TileType.Grass, TileType.Grass],
            [TileType.Grass, TileType.Bridge, TileType.Grass],
        ];
        const actions = service.getActions(mockMatchData);
        expect(actions).toBeDefined();
        expect(actions.length).toBe(2);
        expect(actions).toContainEqual({ x: 1, y: 0 });
        expect(actions).toContainEqual({ x: 2, y: 1 });
        expect(actions).not.toContainEqual({ x: 1, y: 2 });
    });
});
