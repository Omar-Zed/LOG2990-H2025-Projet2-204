import { ItemType } from './item-type.enum';
import { Position } from './position';
import { TileType } from './tile-type.enum';

export interface MapData {
    tiles: TileType[][];
    items: Record<ItemType, Position[]>;
    size: MapSize;
    gameMode: GameMode;
}

export enum MapSize {
    Small = 10,
    Medium = 15,
    Large = 20,
}

export enum GameMode {
    FFA = 'FFA',
    CTF = 'CTF',
}
