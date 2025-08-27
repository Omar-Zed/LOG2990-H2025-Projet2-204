import { ErrorMessage } from '@app/interfaces/game-validation';
import { ItemType } from '@common/interfaces/item-type.enum';
import { MapData, MapSize } from '@common/interfaces/map-data';
import { TileType } from '@common/interfaces/tile-type.enum';

export const GRASS = TileType.Grass;
export const PATH = TileType.Path;
export const BUSH = TileType.Bush;
export const WATER = TileType.Water;
export const BRIDGE = TileType.Bridge;
const BROKEN_BRIDGE = TileType.BrokenBridge;

const REQUIRED_SPAWN_POINTS: Record<MapSize, number> = {
    [MapSize.Small]: 2,
    [MapSize.Medium]: 4,
    [MapSize.Large]: 6,
};

export const VALIDATION_TESTS_CASES = {
    validBridges: [
        [
            [GRASS, PATH, GRASS],
            [WATER, BRIDGE, WATER],
            [GRASS, BUSH, GRASS],
        ],
        [
            [GRASS, WATER, GRASS],
            [GRASS, BRIDGE, BUSH],
            [GRASS, WATER, GRASS],
        ],
    ],
    invalidBridges: [
        {
            tiles: [
                [BRIDGE, WATER, GRASS],
                [WATER, GRASS, PATH],
                [GRASS, BUSH, GRASS],
            ],
            position: { x: 0, y: 0 },
            expectedError: ErrorMessage.BridgeAtEdge,
        },
        {
            tiles: [
                [GRASS, PATH, GRASS],
                [GRASS, BRIDGE, GRASS],
                [GRASS, BUSH, GRASS],
            ],
            position: { x: 1, y: 1 },
            expectedError: ErrorMessage.BridgeNotBetweenWalls,
        },
        {
            tiles: [
                [GRASS, WATER, GRASS],
                [WATER, BRIDGE, GRASS],
                [GRASS, WATER, GRASS],
            ],
            position: { x: 1, y: 1 },
            expectedError: ErrorMessage.BridgeNotBetweenWalls,
        },
        {
            tiles: [
                [GRASS, BUSH, GRASS],
                [WATER, BRIDGE, GRASS],
                [GRASS, WATER, GRASS],
            ],
            position: { x: 1, y: 1 },
            expectedError: ErrorMessage.BridgeNotBetweenWalls,
        },
    ],
    validSpawnPointCase: {
        items: {
            [ItemType.Spawn]: Array.from({ length: REQUIRED_SPAWN_POINTS[MapSize.Small] }, (_, i) => ({ x: i, y: 0 })),
        },
        size: MapSize.Small,
    } as MapData,
    invalidSpawnPointCases: [
        {
            items: { [ItemType.Spawn]: Array(REQUIRED_SPAWN_POINTS[MapSize.Small] - 1).fill({}) },
            size: MapSize.Small,
            errorMessage: ErrorMessage.MissingRequiredItems,
        },
        {
            items: { [ItemType.Spawn]: Array(REQUIRED_SPAWN_POINTS[MapSize.Medium] + 2).fill({}) },
            size: MapSize.Medium,
            errorMessage: ErrorMessage.TooManyItems,
        },
        {
            items: { [ItemType.Spawn]: [] },
            size: MapSize.Large,
            errorMessage: ErrorMessage.MissingRequiredItems,
        },
    ],
    validFalgCase: {
        items: {
            [ItemType.Flag]: [{ x: 0, y: 0 }],
        },
        size: MapSize.Small,
    } as MapData,
    invalidFlagCases: [
        {
            items: { [ItemType.Flag]: [] },
            size: MapSize.Small,
            errorMessage: ErrorMessage.MissingRequiredItems,
        },
        {
            items: {
                [ItemType.Flag]: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
            },
            size: MapSize.Medium,
            errorMessage: ErrorMessage.TooManyItems,
        },
    ],
    validItemsCase: {
        tiles: [[GRASS, BUSH, PATH]],
        items: {
            [ItemType.Flag]: [{ x: 0, y: 0 }],
            [ItemType.Spawn]: [
                { x: 0, y: 1 },
                { x: 0, y: 2 },
            ],
        },
    } as MapData,
    invalidItemsCase: {
        invalidMap: {
            tiles: [[WATER, BRIDGE, BROKEN_BRIDGE]],
            items: {
                [ItemType.Flag]: [{ x: 0, y: 0 }],
                [ItemType.Spawn]: [
                    { x: 0, y: 1 },
                    { x: 0, y: 2 },
                ],
            },
        } as MapData,
        misplacedItems: [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: 2 },
        ],
    },
    validTerrainCoverageCases: [
        { nbTerrain: 80, nbTilesTotal: 100, nbWater: 10, nbBridge: 10 },
        { nbTerrain: 51, nbTilesTotal: 100, nbWater: 25, nbBridge: 24 },
    ],
    invalidTerrainCoverageCases: [
        { nbTerrain: 10, nbTilesTotal: 100, nbWater: 80, nbBridge: 10 },
        { nbTerrain: 50, nbTilesTotal: 100, nbWater: 25, nbBridge: 25 },
    ],
    validTilesAccessibilityCase: {
        map: {
            tiles: [
                [GRASS, BUSH, GRASS],
                [WATER, BROKEN_BRIDGE, WATER],
                [GRASS, PATH, BUSH],
            ],
        } as MapData,
        tilesCount: { nbTerrain: 6, nbBridge: 1, nbWater: 2, nbTilesTotal: 9 },
    },
    invalidTilesAccessibilityCases: [
        {
            tiles: [
                [GRASS, WATER, GRASS],
                [GRASS, PATH, WATER],
                [GRASS, BRIDGE, GRASS],
            ],
            tilesCount: { nbTerrain: 6, nbBridge: 1, nbWater: 2, nbTilesTotal: 9 },
            expectedNonAccessibleTiles: 1,
        },
        {
            tiles: [
                [GRASS, GRASS, GRASS],
                [WATER, WATER, WATER],
                [GRASS, GRASS, GRASS],
            ],
            tilesCount: { nbTerrain: 6, nbBridge: 0, nbWater: 3, nbTilesTotal: 9 },
            expectedNonAccessibleTiles: 3,
        },
    ],
    handleTileNoBridgeCases: [
        {
            tile: TileType.Water,
            expectedCounts: { nbWater: 1, nbBridge: 0, nbTerrain: 0, nbTilesTotal: 1 },
            shouldValidateBridge: false,
        },
        {
            tile: TileType.Grass,
            expectedCounts: { nbWater: 0, nbBridge: 0, nbTerrain: 1, nbTilesTotal: 1 },
        },
        {
            tile: TileType.Path,
            expectedCounts: { nbWater: 0, nbBridge: 0, nbTerrain: 1, nbTilesTotal: 1 },
        },
        {
            tile: TileType.Bush,
            expectedCounts: { nbWater: 0, nbBridge: 0, nbTerrain: 1, nbTilesTotal: 1 },
        },
    ],
    handleTileWithBridgeCases: [
        {
            tile: TileType.Bridge,
            expectedCounts: { nbWater: 0, nbBridge: 1, nbTerrain: 0, nbTilesTotal: 1 },
            shouldValidateBridge: true,
        },
        {
            tile: TileType.BrokenBridge,
            expectedCounts: { nbWater: 0, nbBridge: 1, nbTerrain: 0, nbTilesTotal: 1 },
            shouldValidateBridge: true,
        },
    ],
};
