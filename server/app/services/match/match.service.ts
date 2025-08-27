import { Match } from '@app/classes/match/match';
import { MatchGateway } from '@app/gateways/match/match.gateway';
import { Game } from '@app/model/schema/game.schema';
import { BotService } from '@app/services/bot/bot.service';
import { ChatService } from '@app/services/chat/chat.service';
import { CombatService } from '@app/services/combat/combat.service';
import { GameService } from '@app/services/game/game.service';
import { PlayService } from '@app/services/play/play.service';
import { DEFAULT_MATCH_DATA, MATCH_CODE_LENGTH, MATCH_CODE_RANGE } from '@common/consts/match-data.const';
import { DEFAULT_PLAYER_DATA } from '@common/consts/player-data.const';
import { GameData } from '@common/interfaces/game-data';
import { MatchData } from '@common/interfaces/match-data';
import { Message } from '@common/interfaces/message.enum';
import { PlayerData, PlayerType } from '@common/interfaces/player-data';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class MatchService {
    @Inject(forwardRef(() => MatchGateway)) private matchGateway: MatchGateway;
    @Inject(forwardRef(() => CombatService)) private combatService: CombatService;
    @Inject(forwardRef(() => PlayService)) private playService: PlayService;
    @Inject(forwardRef(() => BotService)) private botService: BotService;
    @Inject(forwardRef(() => ChatService)) private chatService: ChatService;
    @Inject(GameService) private gameService: GameService;
    private matches: Map<string, Match> = new Map();
    private playerToMatchCode: Map<string, string> = new Map();

    async createMatch(playerId: string, gameData: GameData): Promise<MatchData | null> {
        let matchData = null;
        if (await this.canCreateMatch(playerId, gameData)) {
            matchData = {
                ...structuredClone(DEFAULT_MATCH_DATA),
                code: this.getNewMatchCode(),
                gameData,
                players: [{ ...structuredClone(DEFAULT_PLAYER_DATA), id: playerId }],
            };
            const match = new Match(matchData, this);
            this.matches.set(matchData.code, match);
            this.addPlayerToMatchCode(playerId, matchData.code);
            this.matchGateway.connectPlayer(playerId, matchData.code);
        }
        return matchData;
    }

    sendUpdate(match: Match) {
        this.matchGateway.emitUpdate(match.data.code, match.data);
        this.botService.onMatchUpdate(match);
    }

    sendMessage(matchCode: string, message: string) {
        this.matchGateway.emitMessage(matchCode, message);
    }

    playerRemovedFromMatch(playerId: string, reason: string) {
        this.matchGateway.emitRemovedFromMatch(playerId, reason);
        this.disconnectPlayer(playerId);
    }

    joinMatch(playerId: string, matchCode: string): MatchData | null {
        let matchData = null;
        if (this.canJoinMatch(playerId, matchCode)) {
            const match = this.getMatch(matchCode);
            match.join(playerId);
            this.addPlayerToMatchCode(playerId, matchCode);
            this.matchGateway.connectPlayer(playerId, matchCode);
            matchData = match.data;
        }
        return matchData;
    }

    addPlayerToMatchCode(playerId: string, matchCode: string) {
        this.playerToMatchCode.set(playerId, matchCode);
    }

    getMatchFromPlayerId(playerId: string): Match {
        let match: Match;
        const matchCode = this.getMatchCode(playerId);
        if (matchCode) {
            match = this.getMatch(matchCode);
        }
        return match;
    }

    leaveMatch(playerId: string) {
        const match = this.getMatchFromPlayerId(playerId);
        this.disconnectPlayer(playerId);
        if (match) {
            if (match.isHost(playerId) && match.data.playData.isDebugMode) {
                this.playService.changeDebugMode(match, playerId, false);
            }
            this.chatService.logPlayerLeft(match, playerId);
            match.leave(playerId);
            if (match.getConnectedPlayerCount() === 0) {
                match.data.players
                    .filter((p) => p.type !== PlayerType.Player)
                    .forEach((p) => {
                        this.playerToMatchCode.delete(p.id);
                    });
                match.clearTimeout();
                match.clearBotTimeout();
                this.matches.delete(match.data.code);
            }
        }
    }

    killPlayerCombat(match: Match) {
        this.combatService.startCombatEndDeath(match);
    }

    respawnPlayer(match: Match, player: PlayerData) {
        this.combatService.respawnPlayer(match, player);
    }

    startNextTurn(match: Match) {
        this.playService.startNextTurn(match);
    }

    private disconnectPlayer(playerId: string) {
        this.playerToMatchCode.delete(playerId);
        this.matchGateway.disconnectPlayer(playerId);
    }

    private canJoinMatch(playerId: string, matchCode: string): boolean {
        let canJoinMatch = true;
        if (!this.hasMatchCode(matchCode)) {
            this.matchGateway.emitMessage(playerId, Message.InvalidMatchCode, true);
            canJoinMatch = false;
        } else if (this.hasPlayerId(playerId)) {
            this.matchGateway.emitMessage(playerId, Message.AlreadyInMatch, true);
            canJoinMatch = false;
        } else if (this.isMatchFull(matchCode)) {
            this.matchGateway.emitMessage(playerId, Message.RoomFull, true);
            canJoinMatch = false;
        } else if (this.isMatchLocked(matchCode)) {
            this.matchGateway.emitMessage(playerId, Message.RoomLocked, true);
            canJoinMatch = false;
        }
        return canJoinMatch;
    }

    private async canCreateMatch(playerId: string, gameData: GameData): Promise<boolean> {
        const game: Game = await this.gameService.findGame(gameData._id);
        let canCreateMatch = true;
        if (this.hasPlayerId(playerId)) {
            this.matchGateway.emitMessage(playerId, Message.AlreadyInMatch, true);
            canCreateMatch = false;
        } else if (!game) {
            this.matchGateway.emitMessage(playerId, Message.DeletedGame, true);
            canCreateMatch = false;
        } else if (!game.isVisible) {
            this.matchGateway.emitMessage(playerId, Message.InvisibleGame, true);
            canCreateMatch = false;
        }
        return canCreateMatch;
    }

    private isMatchFull(matchCode: string): boolean {
        let isMatchFull = false;
        const match = this.getMatch(matchCode);
        if (match) {
            isMatchFull = match.isFull();
        }
        return isMatchFull;
    }

    private isMatchLocked(matchCode: string): boolean {
        let isMatchLocked = false;
        const match = this.getMatch(matchCode);
        if (match) {
            isMatchLocked = match.data.lobbyData.isLocked;
        }
        return isMatchLocked;
    }

    private getMatch(matchCode: string): Match {
        return this.matches.get(matchCode);
    }

    private getMatchCode(playerId: string): string {
        return this.playerToMatchCode.get(playerId);
    }

    private hasMatchCode(matchCode: string): boolean {
        return this.matches.has(matchCode);
    }

    private hasPlayerId(playerId: string): boolean {
        return this.playerToMatchCode.has(playerId);
    }

    private getNewMatchCode(): string {
        let matchCode: string;
        do {
            matchCode = Math.floor(Math.random() * MATCH_CODE_RANGE)
                .toString()
                .padStart(MATCH_CODE_LENGTH, '0');
        } while (this.hasMatchCode(matchCode));
        return matchCode;
    }
}
