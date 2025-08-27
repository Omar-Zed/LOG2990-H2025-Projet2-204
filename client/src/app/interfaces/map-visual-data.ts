import { ItemType } from '@common/interfaces/item-type.enum';
import { MapSize } from '@common/interfaces/map-data';
import { Position } from '@common/interfaces/position';

export interface TileVisualData {
    tile: string;
    underlay: string | null;
    item: ItemType | null;
    player: PlayerTileVisual | null;
    overlay: string | null;
}

export interface PlayerTileVisual {
    imageFace: string;
    id: string;
}

export interface MapVisualData {
    tiles: TileVisualData[][];
    size: MapSize;
}

export interface OverlayTiles {
    possibleMoves: Position[];
    hoverMoves: Position[];
    actions: Position[];
    playerPosition: Position;
}

export enum AvatarVisualEffect {
    None = 'none',
    Invisible = 'invisible',
    Fade = 'fade',
}
