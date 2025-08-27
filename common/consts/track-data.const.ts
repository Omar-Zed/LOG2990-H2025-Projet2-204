import { TrackingPlayerData, WinnerData } from '@common/interfaces/track-data';
import { TrackingData } from '../interfaces/match-data';
import { Avatar } from '../interfaces/player-data';
import { TileType } from '../interfaces/tile-type.enum';

export const PERCENTAGE_FACTOR = 100;
export const DECIMAL_FACTOR = 100;
export const SPAWN_POSITION = 1;

export const DEFAULT_WINNER_DATA: WinnerData = {
    id: '',
    name: '',
    avatar: Avatar.Default,
    tile: TileType.Grass,
};

export const DEFAULT_TRACKING_DATA: TrackingData = {
    startTime: 0,
    endTime: 0,
    coveredBridges: [],
    rounds: 0,
    flagHoldersCount: 0,
    matchWinner: structuredClone(DEFAULT_WINNER_DATA),
    coveredGroundTiles: [],
    players: [],
};

export const DEFAULT_PLAYER_TRACKING_DATA: TrackingPlayerData = {
    id: '',
    name: '',
    combats: 0,
    escapes: 0,
    victories: 0,
    defeats: 0,
    hpLost: 0,
    hpInflicted: 0,
    pickedUpItems: [],
    coveredGroundTiles: [],
};
