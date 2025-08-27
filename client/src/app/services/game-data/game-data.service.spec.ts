import { DEFAULT_GAME_DATA } from '@app/consts/game-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { GameMode, MapSize } from '@common/interfaces/map-data';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';
import { GameDataService } from './game-data.service';

describe('GameDataService', () => {
    let service: GameDataService;

    beforeEach(() => {
        service = new GameDataService();

        service.gameData.mapData.tiles = Array.from({ length: service.gameData.mapData.size }, () =>
            Array(service.gameData.mapData.size).fill(TileType.Water),
        );

        service.gameData.mapData.items = Object.keys(ItemType).reduce(
            (acc, key) => {
                acc[key as ItemType] = [{ x: 0, y: 0 }];
                return acc;
            },
            {} as Record<ItemType, Position[]>,
        );
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get and edit a tile correctly', () => {
        service.gameData.mapData.tiles[1][1] = TileType.Grass;
        const position: Position = { x: 1, y: 1 };
        service.editTile(TileType.Water, position);
        expect(service.gameData.mapData.tiles[1][1]).toBe(service.getTileFromPosition(position));
    });

    it('should return the right tile', () => {
        const tiles = Array.from(Array(MapSize.Small), () => Array(MapSize.Small).fill(TileType.Grass));
        tiles[3][4] = TileType.Path;
        service.gameData.mapData.tiles = tiles;

        expect(service.getTile(tiles, { x: 6, y: 6 })).toBe(TileType.Grass);
        expect(service.getTile(tiles, { x: 3, y: 4 })).toBe(TileType.Path);
        expect(service.getTileFromPosition({ x: 6, y: 6 })).toBe(TileType.Grass);
        expect(service.getTileFromPosition({ x: 3, y: 4 })).toBe(TileType.Path);
    });

    it('should return TileType.None is out of bound', () => {
        const tiles = Array.from(Array(MapSize.Small), () => Array(MapSize.Small).fill(TileType.Grass));
        service.gameData.mapData.tiles = tiles;

        expect(service.getTile(tiles, { x: -1, y: -1 })).toBe(TileType.None);
        expect(service.getTileFromPosition({ x: -1, y: -1 })).toBe(TileType.None);
    });

    it('should add items correctly', () => {
        const position: Position = { x: 2, y: 2 };
        service.gameData.mapData.items[ItemType.Item1] = [];

        expect(service.getItem(position)).toBeNull();
        service.addItem(ItemType.Item1, position);
        expect(service.getItem(position)).toBe(ItemType.Item1);
    });

    it('should remove items correctly', () => {
        const position: Position = { x: 2, y: 2 };
        service.gameData.mapData.items[ItemType.Item1] = [position];

        expect(service.getItem(position)).toBe(ItemType.Item1);
        service.removeItem(position);
        expect(service.getItem(position)).toBeNull();
    });

    it('should get item by position correctly', () => {
        service.gameData.mapData.items = {
            [ItemType.Item1]: [{ x: 2, y: 2 }],
            [ItemType.Item2]: [{ x: 3, y: 3 }],
            [ItemType.Item3]: [],
            [ItemType.Item4]: [],
            [ItemType.Item5]: [],
            [ItemType.Item6]: [],
            [ItemType.Random]: [],
            [ItemType.Spawn]: [],
            [ItemType.Flag]: [],
        };

        expect(service.getItem({ x: 2, y: 2 })).toBe(ItemType.Item1);
        expect(service.getItem({ x: 3, y: 3 })).toBe(ItemType.Item2);
        expect(service.getItem({ x: 4, y: 4 })).toBeNull();
    });

    it('should return the correct game properties', () => {
        expect(service.getMapSize()).toBe(DEFAULT_GAME_DATA.mapData.size);
        expect(service.getGameMode()).toBe(DEFAULT_GAME_DATA.mapData.gameMode);
    });

    it('should return the correct map size string', () => {
        service.gameData.mapData.size = MapSize.Small;
        expect(service.getMapSizeString()).toBe('10 x 10');

        service.gameData.mapData.size = MapSize.Medium;
        expect(service.getMapSizeString()).toBe('15 x 15');

        service.gameData.mapData.size = MapSize.Large;
        expect(service.getMapSizeString()).toBe('20 x 20');
    });

    it('should return the correct game mode string', () => {
        service.gameData.mapData.gameMode = GameMode.CTF;
        expect(service.getGameModeString()).toBe(GameMode.CTF);
    });

    it('should return the correct item count', () => {
        service.gameData.mapData.items[ItemType.Item1] = [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
        ];
        expect(service.getItemCount(ItemType.Item1)).toBe(2);

        service.gameData.mapData.items[ItemType.Item1] = [];
        expect(service.getItemCount(ItemType.Item1)).toBe(0);

        service.gameData.mapData.items[ItemType.Item1] = [{ x: 1, y: 1 }];
        expect(service.getItemCount(ItemType.Item1)).toBe(1);
    });

    it('should return false if position in bound', () => {
        const tiles = Array.from(Array(MapSize.Small), () => Array(MapSize.Small).fill(TileType.Grass));

        expect(service.isOutOfBound(tiles, { x: 5, y: 1 })).toBeFalse();
        expect(service.isOutOfBound(tiles, { x: 1, y: 5 })).toBeFalse();
        expect(service.isOutOfBound(tiles, { x: 5, y: 5 })).toBeFalse();
    });

    it('should return true if position is higher than size', () => {
        const tiles = Array.from(Array(MapSize.Small), () => Array(MapSize.Small).fill(TileType.Grass));

        expect(service.isOutOfBound(tiles, { x: 20, y: 1 })).toBeTrue();
        expect(service.isOutOfBound(tiles, { x: 1, y: 20 })).toBeTrue();
        expect(service.isOutOfBound(tiles, { x: 20, y: 20 })).toBeTrue();
    });

    it('should return true if position is negative', () => {
        const tiles = Array.from(Array(MapSize.Small), () => Array(MapSize.Small).fill(TileType.Grass));

        expect(service.isOutOfBound(tiles, { x: -1, y: 1 })).toBeTrue();
        expect(service.isOutOfBound(tiles, { x: 1, y: -1 })).toBeTrue();
        expect(service.isOutOfBound(tiles, { x: -1, y: -1 })).toBeTrue();
    });

    it('should return true if map is valid', () => {
        expect(service.isMapValid()).toBeTrue();
    });

    it('should return false if the map is empty', () => {
        service.gameData.mapData.tiles = [];

        expect(service.isMapValid()).toBeFalse();
    });

    it('should return false if the number of rows is incorrect', () => {
        service.gameData.mapData.size = MapSize.Large;
        service.gameData.mapData.tiles = Array.from(Array(MapSize.Large), () => Array(MapSize.Small).fill(TileType.Grass));

        expect(service.isMapValid()).toBeFalse();
    });
    it('should return false if the gameData is different from the initialGameData', () => {
        const initialGameData = structuredClone(DEFAULT_GAME_DATA);
        initialGameData.name = 'Test';
        expect(service.isModified(initialGameData)).toBeTrue();
    });
    it('should return true if the gameData is the same as the initialGameData', () => {
        const initialGameData = structuredClone(service.gameData);
        expect(service.isModified(initialGameData)).toBeFalse();
    });
});
