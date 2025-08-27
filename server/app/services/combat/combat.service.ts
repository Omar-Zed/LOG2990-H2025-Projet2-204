import { Match } from '@app/classes/match/match';
import { ChatService } from '@app/services/chat/chat.service';
import { ItemService } from '@app/services/item/item.service';
import { MapService } from '@app/services/map/map.service';
import { PlayService } from '@app/services/play/play.service';
import { TrackingService } from '@app/services/tracking/tracking.service';
import {
    COMBAT_ANIMATION_DURATION,
    COMBAT_BOT_DURATION,
    COMBAT_END_DURATION,
    COMBAT_SHORT_TURN_DURATION,
    COMBAT_TURN_DURATION,
    DEFAULT_PLAYER_COMBAT_DATA,
    HEALING_ITEM_RATIO,
    ITEM3_BUSH_ATTACK_BONUS,
    ITEM4_HEALING_BONUS,
    ITEM_EFFECT,
    PATH_ATTACK_MODIFICATION,
    PATH_DEFENSE_MODIFICATION,
} from '@common/consts/combat-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { CombatAction, MatchState, PlayerCombatData } from '@common/interfaces/match-data';
import { PlayerData, PlayerType } from '@common/interfaces/player-data';
import { TileType } from '@common/interfaces/tile-type.enum';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CombatService {
    @Inject(MapService) private readonly mapService: MapService;
    @Inject(forwardRef(() => TrackingService)) private trackingService: TrackingService;
    @Inject(forwardRef(() => ItemService)) private readonly itemService: ItemService;
    @Inject(forwardRef(() => PlayService)) private readonly playService: PlayService;
    @Inject(forwardRef(() => ChatService)) private readonly chatService: ChatService;

    attack(match: Match, playerId: string) {
        if (this.canPlayerAct(match, playerId)) {
            this.startAttackAnimation(match);
        }
    }

    escape(match: Match, playerId: string) {
        if (this.canPlayerAct(match, playerId)) {
            this.startEscapeAnimation(match);
        }
    }

    startCombat(match: Match, playerId: string, targetPlayerId: string) {
        match.data.combatData.lastCombatAction = CombatAction.None;
        match.data.combatData.playersCombatData = [this.computePlayerData(match, playerId), this.computePlayerData(match, targetPlayerId)];
        match.data.combatData.isSecondPlayerTurn = match.getPlayer(playerId).speed < match.getPlayer(targetPlayerId).speed;
        this.startCombatWait(match);
    }

    startCombatEndDeath(match: Match) {
        const winner = this.getInactivePlayerData(match);
        const loser = this.getActivePlayerData(match);
        this.chatService.logCombatEnd(match, winner, true);
        match.data.state = MatchState.CombatEnd;
        match.data.combatData.lastCombatAction = CombatAction.None;
        this.trackingService.updateCombats(match, winner, loser);
        match.data.players[winner.playerIndex].combatsWon += 1;
        loser.currentHealth = 0;
        this.respawnPlayer(match, match.data.players[loser.playerIndex]);
        match.sendUpdate();
        const duration = this.getTimeoutDuration(match, COMBAT_END_DURATION);
        if (match.data.playData.activePlayerIndex === loser.playerIndex) {
            match.setTimeout(this.playService.startNextTurn.bind(this.playService, match), duration);
        } else {
            match.setTimeout(this.playService.continueTurn.bind(this.playService, match), duration);
        }
    }

    respawnPlayer(match: Match, player: PlayerData) {
        this.itemService.dropItems(match, player.id, player.items);

        if (player.spawnPoint !== player.position) {
            player.position = this.mapService.getNearestEmptyTile(match.data, player.spawnPoint);
        }
    }

    getCombatPlayerNames(match: Match): string[] {
        return [
            match.data.players[this.getActivePlayerData(match).playerIndex].name,
            match.data.players[this.getInactivePlayerData(match).playerIndex].name,
        ];
    }

    getActivePlayerData(match: Match): PlayerCombatData {
        return match.data.combatData.playersCombatData[Number(match.data.combatData.isSecondPlayerTurn)];
    }

    getInactivePlayerData(match: Match): PlayerCombatData {
        return match.data.combatData.playersCombatData[Number(!match.data.combatData.isSecondPlayerTurn)];
    }

    private getTimeoutDuration(match: Match, duration: number): number {
        const firstPlayer = match.data.players[match.data.combatData.playersCombatData[0].playerIndex];
        const secondPlayer = match.data.players[match.data.combatData.playersCombatData[1].playerIndex];
        const hasTwoBots = firstPlayer.type !== PlayerType.Player && secondPlayer.type !== PlayerType.Player;
        return hasTwoBots ? COMBAT_BOT_DURATION : duration;
    }

    private canPlayerAct(match: Match, playerId: string): boolean {
        const index = match.getPlayerIndex(playerId);
        const isFirstPlayer = !match.data.combatData.isSecondPlayerTurn && match.data.combatData.playersCombatData[0].playerIndex === index;
        const isSecondPlayer = match.data.combatData.isSecondPlayerTurn && match.data.combatData.playersCombatData[1].playerIndex === index;
        const isActivePlayer = isFirstPlayer || isSecondPlayer;
        return isActivePlayer && match.isState([MatchState.CombatWait]);
    }

    private startCombatWait(match: Match) {
        match.data.state = MatchState.CombatWait;
        match.data.combatData.turnDuration = this.getActivePlayerData(match).currentEscapes === 0 ? COMBAT_SHORT_TURN_DURATION : COMBAT_TURN_DURATION;

        this.computeHealingItem(match);

        match.sendUpdate();
        match.setTimeout(this.startAttackAnimation.bind(this, match), match.data.combatData.turnDuration);
    }

    private startAttackAnimation(match: Match) {
        match.data.state = MatchState.CombatAnimation;
        this.executeAttack(match);
        match.data.combatData.isSecondPlayerTurn = !match.data.combatData.isSecondPlayerTurn;
        match.sendUpdate();
        const duration = this.getTimeoutDuration(match, COMBAT_ANIMATION_DURATION);
        if (this.getActivePlayerData(match).currentHealth > 0) {
            match.setTimeout(this.startCombatWait.bind(this, match), duration);
        } else {
            match.setTimeout(this.startCombatEndDeath.bind(this, match), duration);
        }
    }

    private startEscapeAnimation(match: Match) {
        match.data.state = MatchState.CombatAnimation;
        const isEscapeSuccessful = this.executeEscape(match);
        match.data.combatData.isSecondPlayerTurn = !match.data.combatData.isSecondPlayerTurn;
        match.data.combatData.lastCombatAction = isEscapeSuccessful ? CombatAction.SuccessEscape : CombatAction.FailEscape;
        match.sendUpdate();
        const duration = this.getTimeoutDuration(match, COMBAT_ANIMATION_DURATION);
        if (isEscapeSuccessful) {
            match.setTimeout(this.startCombatEndEscape.bind(this, match), duration);
        } else {
            match.setTimeout(this.startCombatWait.bind(this, match), duration);
        }
    }

    private computeHealingItem(match: Match) {
        const playerCombatData = this.getActivePlayerData(match);
        const player = match.data.players[playerCombatData.playerIndex];
        const containItem4 = player.items.includes(ItemType.Item4);

        if (containItem4 && playerCombatData.currentHealth < player.health * HEALING_ITEM_RATIO) {
            playerCombatData.currentHealth += ITEM4_HEALING_BONUS;
        }
    }

    private startCombatEndEscape(match: Match) {
        this.chatService.logCombatEnd(match, this.getInactivePlayerData(match), false);
        match.data.state = MatchState.CombatEnd;
        this.trackingService.updateEscapes(match, this.getInactivePlayerData(match));
        match.sendUpdate();
        match.setTimeout(this.playService.continueTurn.bind(this.playService, match), COMBAT_END_DURATION);
    }

    private executeEscape(match: Match): boolean {
        let isEscapeSuccessful = false;
        const escapingPlayer = this.getActivePlayerData(match);
        if (escapingPlayer.currentEscapes > 0) {
            escapingPlayer.currentEscapes--;
            isEscapeSuccessful = Math.random() < escapingPlayer.escapeChances;
        }
        this.chatService.logEscapeAttempt(match, isEscapeSuccessful, escapingPlayer);
        return isEscapeSuccessful;
    }

    private executeAttack(match: Match) {
        const attackResult = this.computeAttackResult(match);
        match.data.combatData.lastCombatAction = attackResult > 0 ? CombatAction.SuccessAttack : CombatAction.FailAttack;
        this.chatService.logAttack(match, this.getActivePlayerData(match));
        this.chatService.logDefense(match, this.getInactivePlayerData(match));
        this.chatService.logAttackResult(match, attackResult);
        const attacked = this.getInactivePlayerData(match);
        this.trackingService.updateHps(match, attackResult);
        attacked.currentHealth = Math.max(0, attacked.currentHealth - attackResult);
    }

    private computeAttackResult(match: Match): number {
        const rolledAttack = this.rollAttack(match);
        const rolledDefense = this.rollDefense(match);
        match.data.combatData.lastRolledAttack = rolledAttack;
        match.data.combatData.lastRolledDefense = rolledDefense;
        return Math.max(0, rolledAttack + this.getActivePlayerData(match).attack - rolledDefense - this.getInactivePlayerData(match).defense);
    }

    private rollAttack(match: Match): number {
        let dice = match.data.players[this.getActivePlayerData(match).playerIndex].attackDice;
        if (!match.data.playData.isDebugMode) {
            dice = Math.floor(Math.random() * dice) + 1;
        }
        return dice;
    }

    private rollDefense(match: Match): number {
        let result = 1;
        const dice = match.data.players[this.getInactivePlayerData(match).playerIndex].defenseDice;
        if (!match.data.playData.isDebugMode) {
            result = Math.floor(Math.random() * dice) + 1;
        }
        return result;
    }

    private computePlayerData(match: Match, playerId: string): PlayerCombatData {
        const player = match.getPlayer(playerId);
        const playerCombatData = {
            ...structuredClone(DEFAULT_PLAYER_COMBAT_DATA),
            playerIndex: match.getPlayerIndex(playerId),
            currentHealth: player.health,
            standingTile: match.data.gameData.mapData.tiles[player.position.x][player.position.y],
        };
        return this.applyCombatBuffs(match, playerCombatData);
    }

    private applyCombatBuffs(match: Match, playerCombatData: PlayerCombatData): PlayerCombatData {
        if (playerCombatData.standingTile === TileType.Path) {
            playerCombatData.attack += PATH_ATTACK_MODIFICATION;
            playerCombatData.defense += PATH_DEFENSE_MODIFICATION;
        }

        match.data.players[playerCombatData.playerIndex].items.forEach((item) => {
            playerCombatData.attack += ITEM_EFFECT[item].attack;
            playerCombatData.defense += ITEM_EFFECT[item].defense;
            playerCombatData.escapeChances += ITEM_EFFECT[item].escapeChances;
            playerCombatData.maxEscapes += ITEM_EFFECT[item].maxEscapes;
            playerCombatData.currentEscapes += ITEM_EFFECT[item].currentEscapes;

            if (playerCombatData.standingTile === TileType.Bush && item === ItemType.Item3) {
                playerCombatData.attack += ITEM3_BUSH_ATTACK_BONUS;
            }
        });

        return playerCombatData;
    }
}
