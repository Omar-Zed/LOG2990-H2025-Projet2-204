import { TileType } from '@common/interfaces/tile-type.enum';

export const MAX_NAME_LENGTH = 20;
export const MAX_DESCRIPTION_LENGTH = 350;
export const MIN_TERRAIN_RATIO = 0.5;

export const BRIDGE_TYPES = new Set([TileType.Bridge, TileType.BrokenBridge]);
