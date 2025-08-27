import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';

export interface TileComparisonData {
    tiles: TileType[][];
    position: Position;
    deltaPositions: Position[];
    tileTypes: TileType[];
}
