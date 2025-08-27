import { ItemType } from '@common/interfaces/item-type.enum';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';

export interface EditorTile {
    tile: TileType;
    image: string;
    description: string;
    isActive: boolean;
}

export interface EditorItem {
    item: ItemType;
    image: string;
    description: string;
    count: number | null;
}

export interface EditorVisualData {
    tiles: EditorTile[];
    items: EditorItem[];
    selectedTile: TileType;
    paintingTile: TileType | null;
    lastPaintedPosition: Position;
    dragItem: ItemType | null;
    dragItemImage: string;
    dragPosition: Position;
}

export interface EditorEvent {
    tilePosition: Position | null;
    mousePosition: Position | null;
    tile: TileType | null;
    item: ItemType | null;
}
