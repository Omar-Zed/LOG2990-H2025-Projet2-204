import { TestBed } from '@angular/core/testing';
import { GameMode, MapSize } from '@common/interfaces/map-data';
import { MatchData } from '@common/interfaces/match-data';
import { NeighborContext } from '@common/interfaces/movement';
import { Team } from '@common/interfaces/player-data';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { MovementService } from './movement.service';

describe('MovementService', () => {
    let service: MovementService;
    let mockMatchData: MatchData;
    let size: number;

    beforeEach(() => {
        mockMatchData = structuredClone(MOCK_MATCH_DATAS[0]);
        mockMatchData.players[0].position = { x: 1, y: 1 };
        mockMatchData.players[1].position = { x: 2, y: 2 };
        mockMatchData.playData.activePlayerIndex = 0;
        mockMatchData.gameData.mapData.tiles = [
            [TileType.Grass, TileType.Grass, TileType.Grass],
            [TileType.Grass, TileType.Grass, TileType.Grass],
            [TileType.Grass, TileType.Water, TileType.Grass],
        ];
        mockMatchData.gameData.mapData.items.Item1 = [{ x: 0, y: 0 }];
        mockMatchData.gameData.mapData.size = mockMatchData.gameData.mapData.tiles.length as MapSize;
        size = mockMatchData.gameData.mapData.size;

        TestBed.configureTestingModule({
            providers: [MovementService],
        });
        service = TestBed.inject(MovementService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('get possible moves should return valid moves within range', () => {
        const moves = service.getPossibleMoves(mockMatchData);
        expect(moves).toBeDefined();
        expect(moves.every((p) => p.x >= 0 && p.x < size && p.y >= 0 && p.y < size)).toBeTrue();
    });

    it('get shortest path should return shortest path to target', () => {
        const target = { x: 0, y: 2 };
        const result = service.getShortestPath(mockMatchData, target);
        expect(result).toEqual(jasmine.objectContaining({ moveCost: jasmine.any(Number), path: jasmine.any(Array) }));
    });

    it('get actions should return adjacent tiles with players or bridges', () => {
        const actions = service.getActions(mockMatchData);
        expect(actions).toBeDefined();
        expect(actions.length).toBe(0);
    });

    it('get actions should not return action if there is an item on bridges', () => {
        mockMatchData.gameData.mapData.tiles = [
            [TileType.Grass, TileType.Bridge, TileType.Grass],
            [TileType.Grass, TileType.Grass, TileType.Grass],
            [TileType.Grass, TileType.Water, TileType.Grass],
        ];
        mockMatchData.gameData.mapData.items.Item1 = [{ x: 0, y: 1 }];

        const actions = service.getActions(mockMatchData);
        expect(actions).toBeDefined();
        expect(actions.length).toBe(0);
    });

    it('get actions should return action if there not an item on bridges', () => {
        mockMatchData.gameData.mapData.tiles = [
            [TileType.Grass, TileType.Bridge, TileType.Grass],
            [TileType.Grass, TileType.Grass, TileType.Grass],
            [TileType.Grass, TileType.Water, TileType.Grass],
        ];

        const actions = service.getActions(mockMatchData);
        expect(actions).toBeDefined();
        expect(actions.length).toBe(1);
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
    });

    it('is tile a bridge should detect bridge tiles', () => {
        const position: Position = { x: 1, y: 1 };
        const isBridge = service['hasActivatableBridge'](mockMatchData, position);
        expect(isBridge).toBeFalse();
    });

    it('get possible moves standard should return moves within range', () => {
        const currentPos: Position = { x: 1, y: 1 };
        const moves = service['getPossibleMovesStandard'](mockMatchData, currentPos, 2);
        expect(moves).toBeDefined();
        expect(moves.length).toBeGreaterThan(0);
    });

    it('process neighbor should update distances and predecessors', () => {
        const context: NeighborContext = {
            pos: { x: 1, y: 1 },
            cost: 0,
            offset: { x: 1, y: 0 },
            maxCost: 2,
            size,
            matchData: mockMatchData,
            distances: Array(size)
                .fill(null)
                .map(() => Array(size).fill(Infinity)),
            predecessors: new Map<Position, Position>(),
            queue: [],
        };
        service['processNeighbor'](context);
        expect(context.distances[2][1]).toBe(Infinity);
    });

    it('calculate distances and predecessors should compute distances and predecessors', () => {
        const startPos: Position = { x: 1, y: 1 };
        const result = service['calculateDistancesAndPredecessors'](mockMatchData, startPos, 2);
        expect(result.distances[1][1]).toBe(0);
        expect(result.predecessors).toBeInstanceOf(Map);
    });

    it('reconstruct path should build path from predecessors', () => {
        const target: Position = { x: 2, y: 1 };
        const predecessors = new Map<Position, Position>([
            [
                { x: 2, y: 1 },
                { x: 1, y: 1 },
            ],
            [
                { x: 1, y: 1 },
                { x: 0, y: 1 },
            ],
        ]);
        const path = service['reconstructPath'](target, predecessors);
        expect(path).toContain(jasmine.objectContaining({ x: 2, y: 1 }));
    });

    it('reconstruct path should return null on invalid input', () => {
        const target: Position = { x: 2, y: 1 };
        const result = service['reconstructPath'](target, new Map<Position, Position>());
        expect(result).toBe(null);
    });

    it('is tile occupied by player should detect player presence', () => {
        const position: Position = { x: 1, y: 1 };
        const isOccupied = service['isTileOccupiedByPlayer'](mockMatchData, position);
        expect(isOccupied).toBeTrue();
    });

    it('is out of bounds should check map boundaries', () => {
        const position: Position = { x: 3, y: 3 };
        const isOut = service['isOutOfBounds'](mockMatchData, position);
        expect(isOut).toBeTrue();
    });

    it('get movement cost should return tile cost', () => {
        const position: Position = { x: 0, y: 1 };
        const cost = service['getMovementCost'](mockMatchData, position);
        expect(cost).toBeDefined();
    });

    it('p to key should convert position to string key', () => {
        const position: Position = { x: 1, y: 2 };
        const key = service['posToKey'](position);
        expect(key).toBe('1-2');
    });

    it('key to p should convert string key to position', () => {
        const key = '1-2';
        const position = service['keyToPos'](key);
        expect(position).toEqual({ x: 1, y: 2 });
    });

    it('has enemy player should return true if enemy is on tile', () => {
        const position = { x: 3, y: 7 };
        mockMatchData.gameData.mapData.gameMode = GameMode.FFA;
        mockMatchData.players[0].position = position;

        const result = service['hasEnemyPlayer'](mockMatchData, position);

        expect(result).toBe(true);
    });
});
