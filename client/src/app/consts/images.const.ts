import { ItemType } from '@common/interfaces/item-type.enum';
import { TileType } from '@common/interfaces/tile-type.enum';

export const IMAGE_SUFIX = '.png';

export const EMPTY_IMAGE = 'data:,';

export const TILE_IMAGES: Map<TileType, string> = new Map([
    [TileType.Grass, './assets/images/game/tiles/grass.png'],
    [TileType.Path, './assets/images/game/tiles/path.png'],
    [TileType.Bush, './assets/images/game/tiles/bush.png'],
    [TileType.Water, './assets/images/game/tiles/water.png'],
    [TileType.Bridge, './assets/images/game/tiles/bridge.png'],
    [TileType.BrokenBridge, './assets/images/game/tiles/broken-bridge.png'],
]);

export const TILE_IMAGES_PREFIX: Map<TileType, string> = new Map([
    [TileType.Grass, './assets/images/game/tiles/grass/grass-'],
    [TileType.Path, './assets/images/game/tiles/path/path-'],
    [TileType.Bush, './assets/images/game/tiles/bush/bush-'],
    [TileType.Water, './assets/images/game/tiles/water/water-'],
    [TileType.Bridge, './assets/images/game/tiles/bridge/bridge-'],
    [TileType.BrokenBridge, './assets/images/game/tiles/broken-bridge/broken-bridge-'],
]);

export const UNDERLAY_IMAGES_PREFIX = './assets/images/game/tiles/underlay/underlay-';

export const ITEM_IMAGES: Map<ItemType, string> = new Map([
    [ItemType.Item1, './assets/images/game/items/item1.png'],
    [ItemType.Item2, './assets/images/game/items/item2.png'],
    [ItemType.Item3, './assets/images/game/items/item3.png'],
    [ItemType.Item4, './assets/images/game/items/item4.png'],
    [ItemType.Item5, './assets/images/game/items/item5.png'],
    [ItemType.Item6, './assets/images/game/items/item6.png'],
    [ItemType.Random, './assets/images/game/items/random.png'],
    [ItemType.Spawn, './assets/images/game/items/spawn.png'],
    [ItemType.Flag, './assets/images/game/items/flag.png'],
]);

export const BATTLE_PLATFORM_IMAGES = {
    [TileType.Grass]: {
        selfPlatform: './assets/images/game/battle-platforms/self-grass.png',
        enemyPlatform: './assets/images/game/battle-platforms/enemy-grass.png',
    },
    [TileType.Bush]: {
        selfPlatform: './assets/images/game/battle-platforms/self-bush.png',
        enemyPlatform: './assets/images/game/battle-platforms/enemy-bush.png',
    },
    [TileType.Path]: {
        selfPlatform: './assets/images/game/battle-platforms/self-path.png',
        enemyPlatform: './assets/images/game/battle-platforms/enemy-path.png',
    },
    [TileType.Bridge]: {
        selfPlatform: './assets/images/game/battle-platforms/self-bridge.png',
        enemyPlatform: './assets/images/game/battle-platforms/enemy-bridge.png',
    },
    [TileType.BrokenBridge]: {
        selfPlatform: './assets/images/game/battle-platforms/self-grass.png',
        enemyPlatform: './assets/images/game/battle-platforms/enemy-grass.png',
    },
    [TileType.Water]: {
        selfPlatform: './assets/images/game/battle-platforms/self-grass.png',
        enemyPlatform: './assets/images/game/battle-platforms/enemy-grass.png',
    },
    [TileType.None]: {
        selfPlatform: './assets/images/game/battle-platforms/self-grass.png',
        enemyPlatform: './assets/images/game/battle-platforms/enemy-grass.png',
    },
};
