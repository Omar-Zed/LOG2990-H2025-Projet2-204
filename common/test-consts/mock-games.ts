import { GameData } from "../interfaces/game-data";
import { ItemType } from "../interfaces/item-type.enum";
import { GameMode, MapSize } from "../interfaces/map-data";
import { TileType } from "../interfaces/tile-type.enum";

export const MOCK_GAME_DATAS: GameData[] = [
    {
        _id: '123',
        name: 'Game 1',
        isVisible: true,
        description: 'Description 1',
        lastEdited: new Date(),
        mapData: {
            tiles: Array.from({ length: MapSize.Medium }, () => Array(MapSize.Medium).fill(TileType.Grass)),
            items: {
                [ItemType.Item1]: [],
                [ItemType.Item2]: [],
                [ItemType.Item3]: [],
                [ItemType.Item4]: [],
                [ItemType.Item5]: [],
                [ItemType.Item6]: [],
                [ItemType.Random]: [],
                [ItemType.Spawn]: [],
                [ItemType.Flag]: [],
            },
            size: MapSize.Medium,
            gameMode: GameMode.FFA,
        },
    },
    {
        _id: '456',
        name: 'Game 2',
        isVisible: true,
        description: 'Description 2',
        lastEdited: new Date(),
        mapData: {
            tiles: Array.from({ length: MapSize.Large }, () => Array(MapSize.Large).fill(TileType.Grass)),
            items: {
                [ItemType.Item1]: [],
                [ItemType.Item2]: [],
                [ItemType.Item3]: [],
                [ItemType.Item4]: [],
                [ItemType.Item5]: [],
                [ItemType.Item6]: [],
                [ItemType.Random]: [],
                [ItemType.Spawn]: [],
                [ItemType.Flag]: [],
            },
            size: MapSize.Large,
            gameMode: GameMode.CTF,
        },
    },
    {
        _id: '789',
        name: 'Game 3',
        isVisible: true,
        description: 'Description 3',
        lastEdited: new Date(),
        mapData: {
            tiles: Array.from({ length: MapSize.Small }, () => Array(MapSize.Small).fill(TileType.Grass)),
            items: {
                [ItemType.Item1]: [],
                [ItemType.Item2]: [],
                [ItemType.Item3]: [],
                [ItemType.Item4]: [],
                [ItemType.Item5]: [],
                [ItemType.Item6]: [],
                [ItemType.Random]: [],
                [ItemType.Spawn]: [],
                [ItemType.Flag]: [],
            },
            size: MapSize.Small,
            gameMode: GameMode.FFA,
        },
    },
];
