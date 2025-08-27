import { TestBed } from '@angular/core/testing';
import { ITEM_IMAGES } from '@app/consts/images.const';
import { MapService } from '@app/services/map/map.service';
import { ThumbnailService } from './thumbnail.service';
import { ItemType } from '@common/interfaces/item-type.enum';
import { MapData, MapSize, GameMode } from '@common/interfaces/map-data';
import { TileType } from '@common/interfaces/tile-type.enum';

describe('ThumbnailService', () => {
    let service: ThumbnailService;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    const mockMap: MapData = {
        size: MapSize.Small,
        tiles: Array(MapSize.Small).fill(Array(MapSize.Small).fill(TileType.Grass)),
        items: {
            [ItemType.Item1]: [{ x: 1, y: 2 }],
            [ItemType.Item2]: [{ x: 3, y: 4 }],
            [ItemType.Item3]: [],
            [ItemType.Item4]: [],
            [ItemType.Item5]: [],
            [ItemType.Item6]: [],
            [ItemType.Random]: [],
            [ItemType.Spawn]: [],
            [ItemType.Flag]: [],
        },
        gameMode: GameMode.FFA,
    };

    beforeEach(() => {
        mapServiceSpy = jasmine.createSpyObj('MapService', ['getTileImage'], {
            visualMapData: { size: undefined },
        });

        TestBed.configureTestingModule({
            providers: [ThumbnailService, { provide: MapService, useValue: mapServiceSpy }],
        });

        service = TestBed.inject(ThumbnailService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should generate a thumbnail with correct dimensions for Small map', async () => {
        mockMap.tiles = Array(MapSize.Small).fill(Array(MapSize.Small).fill(TileType.Grass));

        mapServiceSpy.getTileImage.and.returnValue('./assets/images/game/tiles/grass.png');

        const thumbnail = await service.getThumbnail(mockMap, true);

        expect(thumbnail).toContain('data:image/png;base64');
        expect(mapServiceSpy.getTileImage).toHaveBeenCalledTimes(MapSize.Small * MapSize.Small);
    });

    it('should generate a thumbnail with correct dimensions for Medium map', async () => {
        mockMap.tiles = Array(MapSize.Medium).fill(Array(MapSize.Medium).fill(TileType.Water));

        mapServiceSpy.getTileImage.and.returnValue('./assets/images/game/tiles/water.png');

        const thumbnail = await service.getThumbnail(mockMap, true);

        expect(thumbnail).toContain('data:image/png;base64');
        expect(mapServiceSpy.getTileImage).toHaveBeenCalledTimes(MapSize.Medium * MapSize.Medium);
    });

    it('should generate a thumbnail with correct dimensions for Large map', async () => {
        mockMap.tiles = Array(MapSize.Large).fill(Array(MapSize.Large).fill(TileType.Path));

        mapServiceSpy.getTileImage.and.returnValue('./assets/images/game/tiles/path.png');

        const thumbnail = await service.getThumbnail(mockMap, true);

        expect(thumbnail).toContain('data:image/png;base64');
        expect(mapServiceSpy.getTileImage).toHaveBeenCalledTimes(MapSize.Large * MapSize.Large);
    });

    it('should load an image successfully', async () => {
        const imageUrl = './assets/images/game/tiles/grass.png';
        const x = 0;
        const y = 0;

        const result = await service['loadImage'](imageUrl, x, y);

        expect(result).not.toBeNull();
        expect(result?.[0]).toBeInstanceOf(HTMLImageElement);
        expect(result?.[1]).toBe(x);
        expect(result?.[2]).toBe(y);
    });

    it('should return null if image fails to load', async () => {
        const imageUrl = './assets/images/game/tiles/invalid.png';
        const x = 1;
        const y = 1;

        const result = await service['loadImage'](imageUrl, x, y);

        expect(result).toBeNull();
    });

    it('should load and draw item images correctly', async () => {
        const item1Image = './assets/images/game/items/item1.png';
        const item2Image = './assets/images/game/items/item2.png';

        mapServiceSpy.getTileImage.and.returnValue('./assets/images/game/tiles/grass.png');

        const thumbnail = await service.getThumbnail(mockMap, true);

        expect(thumbnail).toContain('data:image/png;base64');
        expect(ITEM_IMAGES.get(ItemType.Item1)).toBe(item1Image);
        expect(ITEM_IMAGES.get(ItemType.Item2)).toBe(item2Image);
    });
});
