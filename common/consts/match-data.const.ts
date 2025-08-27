import { LobbyData, MatchData, MatchState, PlayData } from '../interfaces/match-data';
import { DEFAULT_COMBAT_DATA } from './combat-data.const';
import { DEFAULT_GAME_DATA } from './game-data.const';
import { DEFAULT_TRACKING_DATA } from './track-data.const';

export const TURN_WAIT_DURATION = 30000;
export const TURN_START_DURATION = 3000;
export const MOVEMENT_ANIMATION_DURATION = 150;
export const MATCH_END_DURATION = 3000;
export const DROP_ITEMS_DURATION = 10000;
export const TIME_SCALE = 1000;
export const TIMER_INTERVAL = 10;
export const SOCKET_TIMEOUT_DURATION = 1000;

export const DEFAULT_SELF_INDEX = -1;

export const DEFAULT_LOBBY_DATA: LobbyData = {
    isLocked: false,
    hostPlayerIndex: 0,
};

export const DEFAULT_PLAY_DATA: PlayData = {
    timeLeft: TURN_WAIT_DURATION,
    activePlayerIndex: 0,
    isDebugMode: false,
    hasAction: false,
    movementLeft: 0,
};

export const DEFAULT_MATCH_DATA: MatchData = {
    code: '',
    state: MatchState.Lobby,
    gameData: structuredClone(DEFAULT_GAME_DATA),
    lobbyData: structuredClone(DEFAULT_LOBBY_DATA),
    playData: structuredClone(DEFAULT_PLAY_DATA),
    combatData: structuredClone(DEFAULT_COMBAT_DATA),
    trackingData: structuredClone(DEFAULT_TRACKING_DATA),
    players: [],
    chatData: [],
    logData: [],
};

export const MATCH_CODE_RANGE = 10000;
export const MATCH_CODE_LENGTH = 4;
export const RANDOM_THRESHOLD = 0.5;
export const MS_CONVERSION_FACTOR = 10;
export const MINIMUM_COMBATS_TO_WIN = 3;
