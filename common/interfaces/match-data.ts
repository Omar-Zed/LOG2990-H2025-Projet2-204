import { ChatLog, ChatMessage } from './chat-message';
import { GameData } from './game-data';
import { PlayerData } from './player-data';
import { Position } from './position';
import { TileType } from './tile-type.enum';
import { TrackingPlayerData, WinnerData } from './track-data';

export interface MatchData {
    code: string;
    state: MatchState;
    gameData: GameData;
    lobbyData: LobbyData;
    playData: PlayData;
    combatData: CombatData;
    trackingData: TrackingData;
    players: PlayerData[];
    chatData: ChatMessage[];
    logData: ChatLog[];
}

export interface LobbyData {
    isLocked: boolean;
    hostPlayerIndex: number;
}

export interface PlayData {
    timeLeft: number;
    isDebugMode: boolean;
    activePlayerIndex: number;
    hasAction: boolean;
    movementLeft: number;
}

export interface CombatData {
    lastCombatAction: CombatAction;
    turnDuration: number;
    isSecondPlayerTurn: boolean;
    playersCombatData: PlayerCombatData[];
    lastRolledAttack: number;
    lastRolledDefense: number;
}

export interface PlayerCombatData {
    playerIndex: number;
    currentHealth: number;
    currentEscapes: number;
    maxEscapes: number;
    escapeChances: number;
    attack: number;
    defense: number;
    standingTile: TileType;
}

export interface TrackingData {
    startTime: number;
    endTime: number;
    coveredBridges: Position[];
    coveredGroundTiles: Position[];
    rounds: number;
    flagHoldersCount: number;
    matchWinner: WinnerData;
    players: TrackingPlayerData[];
}

export enum CombatAction {
    None = 'none',
    SuccessAttack = 'successAttack',
    FailAttack = 'failAttack',
    SuccessEscape = 'successEscape',
    FailEscape = 'failEscape',
}

export enum MatchState {
    Lobby = 'lobby',
    TurnStart = 'turnStart',
    TurnWait = 'turnWait',
    MovementAnimation = 'movementAnimation',
    ItemWait = 'itemDropSelection',
    CombatWait = 'combatWait',
    CombatAnimation = 'combatAnimation',
    CombatEnd = 'combatEnd',
    MatchEnd = 'matchEnd',
    Statistics = 'statistics',
}
