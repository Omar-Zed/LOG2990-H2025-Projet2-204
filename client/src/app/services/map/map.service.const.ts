import { MapVisualData, OverlayTiles, TileVisualData } from '@app/interfaces/map-visual-data';
import { OUTSIDE_OF_MAP } from '@common/consts/map-data.const';
import { MapSize } from '@common/interfaces/map-data';
import { TileType } from '@common/interfaces/tile-type.enum';

export const ACTION_OVERLAY = 'action-overlay';
export const HOVER_MOVE_OVERLAY = 'hover-move-overlay';
export const POSSIBLE_MOVE_OVERLAY = 'possible-move-overlay';
export const PLAYER_OVERLAY = 'player-overlay';

export const DEFAULT_OVERLAY_TILES: OverlayTiles = {
    possibleMoves: [],
    hoverMoves: [],
    actions: [],
    playerPosition: structuredClone(OUTSIDE_OF_MAP),
};

export const DEFAULT_TILE_VISUAL: TileVisualData = {
    tile: '',
    underlay: null,
    item: null,
    player: null,
    overlay: null,
};

export const PATH_SIMILAR_TILES = [TileType.Path, TileType.None, TileType.Bridge, TileType.BrokenBridge];
export const WATER_SIMILAR_TILES = [TileType.Water, TileType.None, TileType.Bridge, TileType.BrokenBridge];
export const BRIDGE_SIMILAR_TILES = [TileType.Water, TileType.Bridge, TileType.BrokenBridge];

export const MAX_GRASS_VARIANT = 37;
export const MAX_UNDERLAY_VARIANT = 47;

export const RANDOM_NUMBER_BASE = 5;
export const RANDOM_NUMBER_MULTIPLIER = 31;

export const BRIDGE_VARIANTS: Map<string, string> = new Map([
    ['1001', '1'],
    ['0110', '2'],
]);

export const DEFAULT_MAP_VISUAL_DATA: MapVisualData = {
    tiles: Array.from({ length: MapSize.Small }, () => Array(MapSize.Small).fill(DEFAULT_TILE_VISUAL)),
    size: MapSize.Small,
};
