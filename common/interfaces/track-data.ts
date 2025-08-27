import { ItemType } from "./item-type.enum";
import { Position } from "./position";
import { Avatar, Team } from "./player-data";
import { TileType } from "./tile-type.enum";

export interface TrackingPlayerData {
    id: string;
    name: string;
    team?: Team;
    pickedUpItems: ItemType[];
    coveredGroundTiles: Position[];
    combats: number;
    victories: number;
    defeats: number;
    escapes: number;
    hpInflicted: number;
    hpLost: number;
}

export interface WinnerData {
    id: string;
    name: string;
    avatar: Avatar;
    tile: TileType;
}