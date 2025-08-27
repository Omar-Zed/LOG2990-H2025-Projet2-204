import { MapSize } from '../interfaces/map-data';
import { Avatar, DiceType, PlayerData, PlayerType, Team } from '../interfaces/player-data';
import { OUTSIDE_OF_MAP } from './map-data.const';

export const DEFAULT_PLAYER_DATA: PlayerData = {
    id: '',
    name: '',
    avatar: Avatar.Default,
    isConnected: false,
    spawnPoint: structuredClone(OUTSIDE_OF_MAP),
    items: [],
    health: 6,
    speed: 4,
    attackDice: DiceType.D6,
    defenseDice: DiceType.D4,
    position: structuredClone(OUTSIDE_OF_MAP),
    combatsWon: 0,
    type: PlayerType.Player,
    team: Team.None,
};

export const MIN_NAME_LENGTH = 3;
export const MAX_NAME_LENGTH = 16;
export const DEFAULT_STAT = 4;
export const BONUS_STAT = 6;
export const DEFAULT_ESCAPE_POINTS = 2;
export const MAX_ITEMS = 2;

export const MOVE_ANIMATION_DURATION = 150;

export const MIN_PLAYERS = 2;

export const MAX_PLAYERS = {
    [MapSize.Small]: 2,
    [MapSize.Medium]: 4,
    [MapSize.Large]: 6,
};

export const AVATAR_EVOLVED_SUFFIX = '-evolved';
export const AVATAR_SHINY_SUFFIX = '-shiny';
