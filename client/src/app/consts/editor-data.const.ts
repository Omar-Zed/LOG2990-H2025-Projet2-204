import { EditorTile, EditorVisualData } from '@app/interfaces/editor';
import { OUTSIDE_OF_MAP } from '@common/consts/map-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { TileType } from '@common/interfaces/tile-type.enum';
import { EMPTY_IMAGE, ITEM_IMAGES, TILE_IMAGES } from './images.const';
import { ITEM_DESCRIPTION } from '@common/consts/item-data.const';
import { TILE_DESCRIPTION } from './tile-data.const';

export const DEFAULT_EDITOR_TILES: EditorTile[] = [
    {
        tile: TileType.Path,
        image: TILE_IMAGES.get(TileType.Path) as string,
        description: TILE_DESCRIPTION.get(TileType.Path) as string,
        isActive: true,
    },
    {
        tile: TileType.Bush,
        image: TILE_IMAGES.get(TileType.Bush) as string,
        description: TILE_DESCRIPTION.get(TileType.Bush) as string,
        isActive: false,
    },
    {
        tile: TileType.Water,
        image: TILE_IMAGES.get(TileType.Water) as string,
        description: TILE_DESCRIPTION.get(TileType.Water) as string,
        isActive: false,
    },
    {
        tile: TileType.BrokenBridge,
        image: TILE_IMAGES.get(TileType.BrokenBridge) as string,
        description: TILE_DESCRIPTION.get(TileType.BrokenBridge) as string,
        isActive: false,
    },
];

export const DEFAULT_EDITOR_DATA: EditorVisualData = {
    tiles: DEFAULT_EDITOR_TILES,
    items: Object.values(ItemType).map((i: ItemType) => ({
        item: i,
        image: ITEM_IMAGES.get(i) as string,
        description: ITEM_DESCRIPTION.get(i) as string,
        count: 0,
    })),
    selectedTile: DEFAULT_EDITOR_TILES[0].tile,
    paintingTile: null,
    lastPaintedPosition: structuredClone(OUTSIDE_OF_MAP),
    dragItem: null,
    dragItemImage: EMPTY_IMAGE,
    dragPosition: structuredClone(OUTSIDE_OF_MAP),
};

export const EDITOR_ERASE_TILE: TileType = TileType.Grass;

export const SHARED_ITEM_POOL: ItemType[] = [
    ItemType.Item1,
    ItemType.Item2,
    ItemType.Item3,
    ItemType.Item4,
    ItemType.Item5,
    ItemType.Item6,
    ItemType.Random,
];

export const ITEM_POOL_HIGHEST_ITEM: ItemType = ItemType.Random;
