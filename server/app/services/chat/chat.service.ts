import { Match } from '@app/classes/match/match';
import { ITEM_NAME } from '@common/consts/item-data.const';
import { MAX_MESSAGE_LENGTH } from '@common/consts/chat-message.const';
import { ChatLog, ChatMessage } from '@common/interfaces/chat-message';
import { ItemType } from '@common/interfaces/item-type.enum';
import { PlayerCombatData } from '@common/interfaces/match-data';
import { Message } from '@common/interfaces/message.enum';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
    message(match: Match, playerId: string, message: string) {
        if (message.length <= MAX_MESSAGE_LENGTH) {
            const chatMessage: ChatMessage = {
                content: message,
                sender: match.getPlayer(playerId).name,
                timestamp: new Date(),
            };
            match.data.chatData.push(chatMessage);
            match.sendUpdate();
        }
    }

    logItemPickup(match: Match, name: string, itemType: ItemType) {
        const message = `${name} a ramassé ${ITEM_NAME[itemType]}`;
        this.addLogToMatch(match, message);
    }

    logDebugMode(match: Match, isDebugMode: boolean) {
        const message = isDebugMode ? Message.DebugModeOn : Message.DebugModeOff;
        this.addLogToMatch(match, message);
    }

    logPlayerTurnStart(match: Match, playerName: string) {
        this.addLogToMatch(match, `Début du tour de ${playerName}`);
    }

    logMatchWinner(match: Match, playerName: string) {
        this.addLogToMatch(match, `${playerName} à gagné la partie`);
    }

    logEndMatch(match: Match) {
        const activePlayersNames = match.data.players.filter((player) => player.isConnected).map((player) => player.name);
        const formattedPlayersList =
            activePlayersNames.length === 1
                ? activePlayersNames[0]
                : activePlayersNames.slice(0, -1).join(', ') + ' et ' + activePlayersNames[activePlayersNames.length - 1];
        this.addLogToMatch(match, `Fin de partie avec ${formattedPlayersList}`);
    }

    logCombatStart(match: Match, engagingPlayerName: string, targetPlayerName: string) {
        this.addLogToMatch(match, engagingPlayerName + ' a engagé un combat avec ' + targetPlayerName);
    }

    logBridgeToggled(match: Match, playerName: string, position: Position) {
        const bridgeState = match.data.gameData.mapData.tiles[position.x][position.y] === TileType.Bridge ? 'réparé' : 'cassé';
        this.addLogToMatch(match, playerName + ' a ' + bridgeState + ' un pont');
    }

    logEscapeAttempt(match: Match, isSuccessful: boolean, escapingPlayer: PlayerCombatData) {
        const message = 'Tentative de fuite de ' + this.getPlayerName(match, escapingPlayer) + ' : ' + (isSuccessful ? 'Réussie' : 'Échouée');
        this.addLogToMatch(match, message, this.getConcernedPlayers(match));
    }

    logAttack(match: Match, attackingPlayerData: PlayerCombatData) {
        const message = `${this.getPlayerName(match, attackingPlayerData)} attaque (${attackingPlayerData.attack}) avec Dé (+${
            match.data.combatData.lastRolledAttack
        })`;
        this.addLogToMatch(match, message, this.getConcernedPlayers(match));
    }

    logDefense(match: Match, defendingPlayerData: PlayerCombatData) {
        const message = `${this.getPlayerName(match, defendingPlayerData)} se défend (${defendingPlayerData.defense}) avec Dé (+${
            match.data.combatData.lastRolledDefense
        })`;
        this.addLogToMatch(match, message, this.getConcernedPlayers(match));
    }

    logAttackResult(match: Match, attackResult: number) {
        const attackResultText = attackResult > 0 ? `inflige ${attackResult} dégâts` : 'est bloqué';
        const message = `L'attaque ${attackResultText}.`;
        this.addLogToMatch(match, message, this.getConcernedPlayers(match));
    }

    logCombatEnd(match: Match, concernedPlayers: PlayerCombatData, isDead: boolean) {
        const activePlayerName = this.getPlayerName(match, concernedPlayers);
        const message = isDead ? `${activePlayerName} a gagné le combat` : `${activePlayerName} s'est enfui du combat`;
        this.addLogToMatch(match, message);
    }

    logPlayerLeft(match: Match, playerId: string) {
        const leavingPlayer = match.data.players.find((player) => player.id === playerId);
        if (leavingPlayer) {
            const message = `${leavingPlayer.name} a abandonné la partie`;
            this.addLogToMatch(match, message);
        }
    }

    private addLogToMatch(match: Match, message: string, concernedPlayers: string[] = []) {
        const log: ChatLog = {
            content: message,
            timestamp: new Date(),
            concernedPlayersNamesList: concernedPlayers,
        };
        match.data.logData.push(log);
        match.sendUpdate();
    }

    private getConcernedPlayers(match: Match): string[] {
        const combatPlayerData = match.data.combatData.playersCombatData;
        return combatPlayerData.map((playerData) => {
            return this.getPlayerName(match, playerData);
        });
    }

    private getPlayerName(match: Match, player: PlayerCombatData): string {
        return match.data.players[player.playerIndex].name;
    }
}
