import { COMBAT_TURN_DURATION } from '../consts/combat-data.const';
import { TURN_WAIT_DURATION } from '../consts/match-data.const';
import { CombatAction, CombatData, LobbyData, MatchData, MatchState, PlayData, PlayerCombatData } from '../interfaces/match-data';
import { TileType } from '../interfaces/tile-type.enum';
import { MOCK_GAME_DATAS } from './mock-games';
import { MOCK_PLAYER_DATAS } from './mock-players';
import { MOCK_TRACKING_DATA } from './mock-track-data';

export const MOCK_MATCH_CODES = ['1111', '2222', '3333'];

export const MOCK_LOBBY_DATA: LobbyData = {
    isLocked: false,
    hostPlayerIndex: 0,
};

export const MOCK_PLAY_DATA: PlayData = {
    timeLeft: structuredClone(TURN_WAIT_DURATION),
    isDebugMode: false,
    activePlayerIndex: 0,
    hasAction: true,
    movementLeft: 6,
};

export const MOCK_PLAYER_COMBAT_DATAS: PlayerCombatData[] = [
    {
        playerIndex: 0,
        currentHealth: 6,
        currentEscapes: 2,
        maxEscapes: 2,
        escapeChances: 0.3,
        attack: 4,
        defense: 4,
        standingTile: TileType.Grass,
    },
    {
        playerIndex: 1,
        currentHealth: 6,
        currentEscapes: 2,
        maxEscapes: 2,
        escapeChances: 0.3,
        attack: 4,
        defense: 4,
        standingTile: TileType.Grass,
    },
];

export const MOCK_COMBAT_DATA: CombatData = {
    lastCombatAction: CombatAction.None,
    turnDuration: structuredClone(COMBAT_TURN_DURATION),
    isSecondPlayerTurn: false,
    playersCombatData: structuredClone(MOCK_PLAYER_COMBAT_DATAS),
    lastRolledAttack: 4,
    lastRolledDefense: 1,
};

export const MOCK_MATCH_DATAS: MatchData[] = [
    {
        code: structuredClone(MOCK_MATCH_CODES[0]),
        players: structuredClone(MOCK_PLAYER_DATAS),
        state: MatchState.TurnWait,
        gameData: structuredClone(MOCK_GAME_DATAS[0]),
        lobbyData: structuredClone(MOCK_LOBBY_DATA),
        playData: structuredClone(MOCK_PLAY_DATA),
        combatData: structuredClone(MOCK_COMBAT_DATA),
        chatData: [],
        logData: [],
        trackingData: structuredClone(MOCK_TRACKING_DATA),
    },
    {
        code: structuredClone(MOCK_MATCH_CODES[1]),
        players: structuredClone(MOCK_PLAYER_DATAS),
        state: MatchState.TurnWait,
        gameData: structuredClone(MOCK_GAME_DATAS[1]),
        lobbyData: structuredClone(MOCK_LOBBY_DATA),
        playData: structuredClone(MOCK_PLAY_DATA),
        combatData: structuredClone(MOCK_COMBAT_DATA),
        chatData: [],
        logData: [],
        trackingData: structuredClone(MOCK_TRACKING_DATA),
    },
    {
        code: structuredClone(MOCK_MATCH_CODES[2]),
        players: structuredClone(MOCK_PLAYER_DATAS),
        state: MatchState.TurnWait,
        gameData: structuredClone(MOCK_GAME_DATAS[2]),
        lobbyData: structuredClone(MOCK_LOBBY_DATA),
        playData: structuredClone(MOCK_PLAY_DATA),
        combatData: structuredClone(MOCK_COMBAT_DATA),
        chatData: [],
        logData: [],
        trackingData: structuredClone(MOCK_TRACKING_DATA),
    },
];
