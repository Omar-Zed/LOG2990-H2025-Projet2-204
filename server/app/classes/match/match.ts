import { MatchService } from '@app/services/match/match.service';
import { OUTSIDE_OF_MAP } from '@common/consts/map-data.const';
import { DEFAULT_PLAYER_DATA, MAX_PLAYERS } from '@common/consts/player-data.const';
import { MatchData, MatchState } from '@common/interfaces/match-data';
import { Message } from '@common/interfaces/message.enum';
import { PlayerData, PlayerType } from '@common/interfaces/player-data';

export class Match {
    data: MatchData;
    lastTimeoutStart: Date = new Date();
    private matchService: MatchService;
    private timeout: NodeJS.Timeout | null = null;
    private botTimeout: NodeJS.Timeout | null = null;

    constructor(matchData: MatchData, matchService: MatchService) {
        this.data = matchData;
        this.matchService = matchService;
    }

    sendUpdate() {
        this.matchService.sendUpdate(this);
    }

    sendMessage(message: string) {
        this.sendUpdate();
        this.matchService.sendMessage(this.data.code, message);
    }

    sendMessageToHost(message: string) {
        this.sendUpdate();
        this.matchService.sendMessage(this.data.players[this.data.lobbyData.hostPlayerIndex].id, message);
    }

    setTimeout(callback: () => void, duration: number) {
        this.clearTimeout();
        this.lastTimeoutStart = new Date();
        this.timeout = setTimeout(callback, duration);
    }

    setBotTimeout(callback: () => void, duration: number) {
        if (!this.botTimeout) {
            this.botTimeout = setTimeout(() => {
                this.botTimeout = null;
                callback();
            }, duration);
        }
    }

    isState(states: MatchState[]): boolean {
        return states.includes(this.data.state);
    }

    join(playerId: string) {
        this.data.players.push({ ...structuredClone(DEFAULT_PLAYER_DATA), id: playerId });
        this.sendUpdate();
    }

    changeLockStatus(lockStatus: boolean) {
        if (lockStatus || this.isFull()) {
            this.data.lobbyData.isLocked = true;
            this.kickJoiningPlayers();
        } else {
            this.data.lobbyData.isLocked = false;
        }
    }

    leave(playerId: string): void {
        switch (this.data.state) {
            case MatchState.Lobby:
                return this.isHost(playerId) ? this.hostLeaveLobby(playerId) : this.playerLeaveLobby(playerId);
            case MatchState.Statistics:
            case MatchState.MatchEnd:
                return this.playerLeaveStats(playerId);
            case MatchState.CombatAnimation:
            case MatchState.CombatWait:
                this.playerLeaveCombat(playerId);
        }
        return this.playerLeaveMatch(playerId);
    }

    getConnectedPlayerCount(): number {
        return this.data.players.filter((p) => p.isConnected && p.type === PlayerType.Player).length;
    }

    isFull(): boolean {
        const maxPlayerCount = MAX_PLAYERS[this.data.gameData.mapData.size];
        return this.data.players.filter((p) => p.isConnected).length >= maxPlayerCount;
    }

    isHost(playerId: string): boolean {
        const playerIdex = this.getPlayerIndex(playerId);
        return playerIdex === this.data.lobbyData.hostPlayerIndex;
    }

    isActivePlayer(playerId: string): boolean {
        const playerIdex = this.getPlayerIndex(playerId);
        return playerIdex === this.data.playData.activePlayerIndex;
    }

    getPlayer(playerId: string): PlayerData {
        return this.data.players.find((p) => p.id === playerId);
    }

    getPlayerIndex(playerId: string): number {
        return this.data.players.findIndex((p) => p.id === playerId);
    }

    clearTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    clearBotTimeout() {
        if (this.botTimeout) {
            clearTimeout(this.botTimeout);
            this.botTimeout = null;
        }
    }

    kickPlayer(playerId: string, reason: string) {
        this.matchService.playerRemovedFromMatch(playerId, reason);
        this.data.players = this.data.players.filter((p) => p.id !== playerId);
    }

    private kickJoiningPlayers() {
        const playerIdsToKick = this.data.players.filter((p) => !p.isConnected).map((p) => p.id);
        playerIdsToKick.forEach((playerId) => {
            this.kickPlayer(playerId, Message.LockedFromLobby);
        });
    }

    private hostLeaveLobby(hostId: string) {
        this.data.players = this.data.players.filter((p) => p.id !== hostId);
        const playerIdsToKick = this.data.players.map((p) => p.id);
        playerIdsToKick.forEach((playerId) => {
            this.kickPlayer(playerId, Message.AdminQuit);
        });
    }

    private playerLeaveLobby(playerId: string) {
        this.data.players = this.data.players.filter((p) => p.id !== playerId);
        this.sendUpdate();
    }

    private playerLeaveCombat(playerId: string) {
        const playerIndex = this.getPlayerIndex(playerId);
        if (this.data.combatData.playersCombatData[0].playerIndex === playerIndex) {
            this.data.combatData.isSecondPlayerTurn = false;
        } else if (this.data.combatData.playersCombatData[1].playerIndex === playerIndex) {
            this.data.combatData.isSecondPlayerTurn = true;
        }
        this.matchService.killPlayerCombat(this);
    }

    private playerLeaveStats(playerId: string) {
        const player = this.data.players.find((p) => p.id === playerId);
        player.isConnected = false;
        this.sendMessage(`${player.name} a quitté la partie`);
    }

    private playerLeaveMatch(playerId: string) {
        const player = this.data.players.find((p) => p.id === playerId);
        player.isConnected = false;
        const connectedPlayers = this.data.players.filter((p) => p.isConnected);
        if (connectedPlayers.length === 1) {
            this.kickPlayer(connectedPlayers[0].id, Message.LastPlayerRemaining);
        } else {
            if (this.isActivePlayer(player.id) && this.isState([MatchState.TurnWait])) {
                this.matchService.startNextTurn(this);
            }
            player.spawnPoint = structuredClone(OUTSIDE_OF_MAP);
            this.matchService.respawnPlayer(this, player);
            this.sendMessage(`${player.name} a quitté la partie`);
        }
    }
}
