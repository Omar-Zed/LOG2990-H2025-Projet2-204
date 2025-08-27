import { TestBed } from '@angular/core/testing';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { SURROUNDING_POSITIONS_PLUS } from '@common/consts/map-data.const';
import { MOVE_ANIMATION_DURATION } from '@common/consts/player-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { MapSize } from '@common/interfaces/map-data';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';
import { MOCK_PLAYER_DATAS } from '@common/test-consts/mock-players';
import { BehaviorSubject } from 'rxjs';
import { MapService } from './map.service';
import { ACTION_OVERLAY, DEFAULT_OVERLAY_TILES, HOVER_MOVE_OVERLAY, POSSIBLE_MOVE_OVERLAY } from './map.service.const';

describe('MapService', () => {
    let service: MapService;
    let mockGameDataService: jasmine.SpyObj<GameDataService>;

    beforeEach(() => {
        mockGameDataService = jasmine.createSpyObj('GameDataService', ['getTile', 'isOutOfBound', 'gameData'], {
            mapUpdate: new BehaviorSubject<Position | null>(null),
            gameData: {
                mapData: {
                    size: MapSize.Small,
                    tiles: Array.from({ length: MapSize.Small }, () => Array(MapSize.Small).fill(TileType.Grass)),
                    items: Object.values(ItemType).reduce(
                        (acc, key) => {
                            acc[key] = [];
                            return acc;
                        },
                        {} as Record<ItemType, Position[]>,
                    ),
                },
            },
        });

        TestBed.configureTestingModule({
            providers: [MapService, { provide: GameDataService, useValue: mockGameDataService }],
        });
        service = TestBed.inject(MapService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should correctly return if a position is out of bounds in updateTile', () => {
        mockGameDataService.isOutOfBound.and.returnValue(true);
        const position: Position = { x: -1, y: -1 };
        service['updateTile'](position);
        expect(mockGameDataService.isOutOfBound).toHaveBeenCalledWith(mockGameDataService.gameData.mapData.tiles, position);
    });

    it('should update tile if new tile data is different', () => {
        const position: Position = { x: 1, y: 1 };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getTileVisualData').and.returnValue({
            tile: 'newTile.png',
            underlay: 'newUnderlay.png',
            item: 'newItem.png' as ItemType,
            player: { imageFace: 'newP11', id: 'oldP11' },
            overlay: 'newOverlay.png',
        });

        service.visualMapData.tiles[1][1] = {
            tile: 'oldTile.png',
            underlay: 'oldUnderlay.png',
            item: 'oldItem.png' as ItemType,
            player: { imageFace: 'P11', id: 'oldP11' },
            overlay: 'oldOverlay.png',
        };

        service['updateTile'](position);
        expect(service.visualMapData.tiles[1][1].tile).toBe('newTile.png');
        expect(service.visualMapData.tiles[1][1].underlay).toBe('newUnderlay.png');
        expect(service.visualMapData.tiles[1][1].item).toBe('newItem.png' as ItemType);
    });

    it('should initialize visualMapData correctly', () => {
        expect(service.visualMapData).toBeDefined();
        expect(service.visualMapData.size).toBe(MapSize.Small);
    });

    it('should update all tiles on map update', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'updateAllTiles');
        mockGameDataService.mapUpdate.next(null);
        expect(service['updateAllTiles']).toHaveBeenCalled();
    });

    it('should update the entire map when position is null', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'updateAllTiles').and.callThrough();
        service['onMapUpdate'](null);
        expect(service['updateAllTiles']).toHaveBeenCalled();
        expect(service.visualMapData.tiles.length).toBe(mockGameDataService.gameData.mapData.size);
    });

    it('should update surrounding tiles when position is provided', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'updateSuroundingTiles').and.callThrough();
        const position: Position = { x: 2, y: 2 };
        service['onMapUpdate'](position);
        expect(service['updateSuroundingTiles']).toHaveBeenCalledWith(position);
    });

    it('should update surrounding tiles on map update with a position', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'updateSuroundingTiles');
        const position: Position = { x: 1, y: 1 };
        mockGameDataService.mapUpdate.next(position);
        expect(service['updateSuroundingTiles']).toHaveBeenCalledWith(position);
    });

    it('should return correct tile variants for all tile types', () => {
        const position: Position = { x: 2, y: 2 };
        expect(service['getTileVariant'](TileType.Water, mockGameDataService.gameData.mapData.tiles, position)).toBeDefined();
        expect(service['getTileVariant'](TileType.Path, mockGameDataService.gameData.mapData.tiles, position)).toBeDefined();
        expect(service['getTileVariant'](TileType.Bridge, mockGameDataService.gameData.mapData.tiles, position)).toBeDefined();
        expect(service['getTileVariant'](TileType.BrokenBridge, mockGameDataService.gameData.mapData.tiles, position)).toBeDefined();
        expect(service['getTileVariant'](TileType.Grass, mockGameDataService.gameData.mapData.tiles, position)).toBeDefined();
    });

    it('should call updateTile on all surrounding positions', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'updateTile');
        const position: Position = { x: 3, y: 3 };
        service['updateSuroundingTiles'](position);
        const numberOfCalls = 9;
        expect(service['updateTile']).toHaveBeenCalledTimes(numberOfCalls);
    });

    it('should return correct underlay image for all tile types', () => {
        const position: Position = { x: 3, y: 3 };
        mockGameDataService.getTile.and.returnValue(TileType.Water);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getUnderlayVariant').and.returnValue('1');

        let result = service['getUnderlayImage'](mockGameDataService.gameData.mapData.tiles, position);
        expect(result).toContain('1');

        mockGameDataService.getTile.and.returnValue(TileType.BrokenBridge);
        result = service['getUnderlayImage'](mockGameDataService.gameData.mapData.tiles, position);
        expect(result).toContain('1');

        mockGameDataService.getTile.and.returnValue(TileType.Bridge);
        result = service['getUnderlayImage'](mockGameDataService.gameData.mapData.tiles, position);
        expect(result).toContain('0');

        mockGameDataService.getTile.and.returnValue(TileType.Grass);
        result = service['getUnderlayImage'](mockGameDataService.gameData.mapData.tiles, position);
        expect(result).toBeNull();
    });

    it('should correctly compare tiles', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'compareTile').and.returnValue(true);
        const position: Position = { x: 4, y: 4 };
        const result = service['compareTile'](mockGameDataService.gameData.mapData.tiles, position, [TileType.Grass]);
        expect(result).toBeTrue();
    });

    it('should generate random string for tile variant', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getRandomString').and.returnValue('3');
        const position: Position = { x: 5, y: 5 };
        const maxValue = 5;
        const result = service['getRandomString'](position, maxValue);
        expect(result).toBe('3');
    });

    it('should return correct underlay variant for a given position', () => {
        const position: Position = { x: 2, y: 3 };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getRandomString').and.returnValue('2');
        const result = service['getUnderlayVariant'](position);
        expect(result).toBe('2');
    });

    it('should return correct tile similarity string', () => {
        const position: Position = { x: 2, y: 2 };
        const deltaPositions: Position[] = SURROUNDING_POSITIONS_PLUS;
        const tileTypes: TileType[] = [TileType.Grass, TileType.Path];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'compareTiles').and.returnValue([true, false, true, false]);

        const result = service['getSimilarTiles']({
            tiles: mockGameDataService.gameData.mapData.tiles,
            position,
            deltaPositions,
            tileTypes,
        });
        expect(result).toBe('0101');
    });

    it('should correctly check if an item is in a tile', () => {
        const positionIn: Position = { x: 2, y: 2 };
        const positionOut: Position = { x: 5, y: 5 };

        const items: Record<ItemType, Position[]> = Object.fromEntries(
            (Object.keys(ItemType) as (keyof typeof ItemType)[]).map((key) => [ItemType[key], [] as Position[]]),
        ) as Record<ItemType, Position[]>;
        items.Item1 = [{ x: 2, y: 2 }];
        items.Item2 = [{ x: 2, y: 2 }];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getItem').and.callThrough();

        const resultIn = service['getItem'](items, positionIn);
        expect(resultIn).toBe(ItemType.Item1);
        const resultOut = service['getItem'](items, positionOut);
        expect(resultOut).toBeNull();
    });

    it('should call updateAllTiles when position is null', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'updateAllTiles');
        service['onMapUpdate'](null);
        expect(service['updateAllTiles']).toHaveBeenCalled();
    });

    it('should call updateSuroundingTiles when position is not null', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'updateSuroundingTiles');
        const position: Position = { x: 2, y: 2 };
        service['onMapUpdate'](position);
        expect(service['updateSuroundingTiles']).toHaveBeenCalledWith(position);
    });

    it('should return correct tile visual data', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getTileImage').and.returnValue('tile.png');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getUnderlayImage').and.returnValue('underlay.png');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getItem').and.returnValue(ItemType.Item1);

        const position: Position = { x: 1, y: 1 };
        const result = service['getTileVisualData'](mockGameDataService.gameData.mapData, position);

        expect(result.tile).toBe('tile.png');
        expect(result.underlay).toBe('underlay.png');
        expect(result.item).toBe(ItemType.Item1);
    });

    it('should return correct water variant', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getSimilarTiles').and.returnValue('1100');
        const position: Position = { x: 3, y: 3 };
        const result = service['getWaterVariant'](mockGameDataService.gameData.mapData.tiles, position);
        expect(result).toBe('1100');
    });

    it('should return correct path variant', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getSimilarTiles').and.returnValue('1010');
        const position: Position = { x: 3, y: 3 };
        const result = service['getPathVariant'](mockGameDataService.gameData.mapData.tiles, position);
        expect(result).toBe('1010');
    });

    it('should return correct grass variant', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getRandomString').and.returnValue('2');
        const position: Position = { x: 4, y: 4 };
        const result = service['getGrassVariant'](position);
        expect(result).toBe('2');
    });

    it('should return correct tile comparison results', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'compareTile').and.returnValue(true);
        const position: Position = { x: 2, y: 2 };
        const deltaPositions: Position[] = SURROUNDING_POSITIONS_PLUS;
        const tileTypes: TileType[] = [TileType.Grass];
        const result = service['compareTiles']({
            tiles: mockGameDataService.gameData.mapData.tiles,
            position,
            deltaPositions,
            tileTypes,
        });
        expect(result).toEqual([true, true, true, true]);
    });

    it('should return correct bridge variant based on surrounding tiles', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getSimilarTiles').and.returnValue('1001');
        const position: Position = { x: 3, y: 3 };
        const result = service['getBridgeVariant'](mockGameDataService.gameData.mapData.tiles, position);
        expect(result).toBe('1');
    });

    it('should return correct overlay based on conditions', () => {
        const position: Position = { x: 1, y: 1 };

        service['overlayTiles'].actions = [{ x: 1, y: 1 }];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getActionOverlay').and.returnValue(ACTION_OVERLAY);
        let result = service['getOverlay'](position);
        expect(result).toBe(ACTION_OVERLAY);

        service['overlayTiles'].actions = [];
        service['overlayTiles'].possibleMoves = [{ x: 1, y: 1 }];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getMoveOverlay').and.returnValue(POSSIBLE_MOVE_OVERLAY);
        result = service['getOverlay'](position);
        expect(result).toBe(POSSIBLE_MOVE_OVERLAY);

        service['overlayTiles'].possibleMoves = [];
        result = service['getOverlay'](position);
        expect(result).toBeNull();
    });

    it('should return correct move overlay based on position conditions', () => {
        const position: Position = { x: 1, y: 1 };

        service['overlayTiles'].playerPosition = { x: 1, y: 1 };
        service['overlayTiles'].hoverMoves = [{ x: 1, y: 1 }];
        let result = service['getMoveOverlay'](position);
        expect(result).toBe(HOVER_MOVE_OVERLAY);

        service['overlayTiles'].playerPosition = { x: 2, y: 2 };
        service['overlayTiles'].hoverMoves = [];
        service['overlayTiles'].possibleMoves = [{ x: 1, y: 1 }];
        result = service['getMoveOverlay'](position);
        expect(result).toBe(POSSIBLE_MOVE_OVERLAY);

        service['overlayTiles'].possibleMoves = [];
        result = service['getMoveOverlay'](position);
        expect(result).toBeNull();
    });

    it('should return correct action overlay based on position conditions', () => {
        const position: Position = { x: 1, y: 1 };

        service['overlayTiles'].playerPosition = { x: 1, y: 1 };
        let result = service['getActionOverlay'](position);
        expect(result).toBeNull();

        service['overlayTiles'].playerPosition = { x: 2, y: 2 };
        service['overlayTiles'].actions = [{ x: 1, y: 1 }];
        result = service['getActionOverlay'](position);
        expect(result).toBe(ACTION_OVERLAY);
    });

    it('should set players correctly', () => {
        const players = structuredClone(MOCK_PLAYER_DATAS);
        service.setPlayers(players);
        expect(service['players']).toBe(players);
    });

    it('should execute move player animation', () => {
        service['players'] = structuredClone(MOCK_PLAYER_DATAS);
        const position = { x: 6, y: 5 };
        service['movePlayerAnimation'](0, position);
        expect(service['players'][0].position).toBe(position);
    });

    it('should handle overlay-related methods correctly', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'updateAllTiles');
        const pos: Position = { x: 1, y: 1 };
        const pos2: Position = { x: 2, y: 2 };

        service.setHoverMoves([pos]);
        expect(service['overlayTiles'].hoverMoves).toEqual([pos]);
        expect(service['updateAllTiles']).toHaveBeenCalledTimes(1);

        service.setPossibleMoves([pos], pos2);
        expect(service['overlayTiles'].possibleMoves).toEqual([pos]);
        expect(service['overlayTiles'].playerPosition).toEqual(pos2);
        expect(service['updateAllTiles']).toHaveBeenCalledTimes(2);

        service.setActions([pos], pos2);
        expect(service['overlayTiles'].actions).toEqual([pos]);
        expect(service['overlayTiles'].playerPosition).toEqual(pos2);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- expect's count
        expect(service['updateAllTiles']).toHaveBeenCalledTimes(3);

        service.clearOverlays();
        expect(service['overlayTiles']).toEqual(DEFAULT_OVERLAY_TILES);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- expect's count
        expect(service['updateAllTiles']).toHaveBeenCalledTimes(4);

        service['overlayTiles'].actions = [pos];
        service.clearActions();
        expect(service['overlayTiles'].actions).toEqual([]);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- expect's count
        expect(service['updateAllTiles']).toHaveBeenCalledTimes(5);
    });

    it('should schedule player movement animations for each position', () => {
        const positions = [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const movePlayerAnimationSpy = spyOn<any>(service, 'movePlayerAnimation');
        jasmine.clock().install();
        service.movePlayer(0, positions);
        jasmine.clock().tick(MOVE_ANIMATION_DURATION + 1);
        expect(movePlayerAnimationSpy).toHaveBeenCalled();
        jasmine.clock().uninstall();
    });
});
