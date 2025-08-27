import { Match } from '@app/classes/match/match';
import { ChatService } from '@app/services/chat/chat.service';
import { CombatService } from '@app/services/combat/combat.service';
import { ItemService } from '@app/services/item/item.service';
import { MapService } from '@app/services/map/map.service';
import { TrackingService } from '@app/services/tracking/tracking.service';
import {
    DROP_ITEMS_DURATION,
    MATCH_END_DURATION,
    MINIMUM_COMBATS_TO_WIN,
    MOVEMENT_ANIMATION_DURATION,
    TURN_START_DURATION,
    TURN_WAIT_DURATION,
} from '@common/consts/match-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { GameMode } from '@common/interfaces/map-data';
import { MatchState } from '@common/interfaces/match-data';
import { Message } from '@common/interfaces/message.enum';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PlayService {
    @Inject(MapService) private readonly mapService: MapService;
    @Inject(TrackingService) private readonly trackingService: TrackingService;
    @Inject(forwardRef(() => ItemService)) private readonly itemService: ItemService;
    @Inject(forwardRef(() => CombatService)) private readonly combatService: CombatService;
    @Inject(forwardRef(() => ChatService)) private readonly chatService: ChatService;

    endTurn(match: Match, playerId: string) {
        if (match.isActivePlayer(playerId) && match.isState([MatchState.TurnWait])) {
            this.startNextTurn(match);
        }
    }

    move(match: Match, playerId: string, position: Position) {
        if (match.isActivePlayer(playerId) && match.isState([MatchState.TurnWait])) {
            const shortestPath = this.mapService.getShortestPath(match.data, position);

            if (shortestPath.moveCost <= match.data.playData.movementLeft) {
                match.getPlayer(playerId).position = shortestPath.path[shortestPath.path.length - 1];
                match.data.playData.movementLeft -= shortestPath.moveCost;
                match.data.state = MatchState.MovementAnimation;
                this.setTimeLeft(match);
                this.trackingService.updateGroundTiles(match, shortestPath.path, playerId);
                match.sendUpdate();
                match.setTimeout(this.continueTurn.bind(this, match), (shortestPath.path.length + 1) * MOVEMENT_ANIMATION_DURATION);
            }
        }
    }

    action(match: Match, playerId: string, position: Position) {
        if (match.data.playData.hasAction && match.isActivePlayer(playerId) && match.isState([MatchState.TurnWait])) {
            const actions = this.mapService.getActions(match.data);
            if (actions.some((a) => a.x === position.x && a.y === position.y)) {
                match.data.playData.hasAction = false;
                this.executeAction(match, playerId, position);
            }
        }
    }

    debugMove(match: Match, playerId: string, position: Position) {
        if (match.data.playData.isDebugMode && match.isActivePlayer(playerId) && match.isState([MatchState.TurnWait])) {
            const possibleMoves = this.mapService.getPossibleMovesDebug(match.data);
            const isMoveValid = possibleMoves.some((m) => m.x === position.x && m.y === position.y);
            if (isMoveValid) {
                const player = match.getPlayer(playerId);
                player.position = position;
                this.trackingService.updateGroundTiles(match, [position], playerId);
                match.sendUpdate();
            }
        }
    }

    changeDebugMode(match: Match, playerId: string, isDebugMode: boolean) {
        if (match.isHost(playerId)) {
            match.data.playData.isDebugMode = isDebugMode;
            match.sendMessage(isDebugMode ? Message.DebugModeOn : Message.DebugModeOff);
            this.chatService.logDebugMode(match, isDebugMode);
        }
    }

    startNextTurn(match: Match) {
        match.data.state = MatchState.TurnStart;
        match.data.playData.hasAction = false;
        match.data.playData.movementLeft = 0;
        match.data.playData.timeLeft = TURN_WAIT_DURATION;
        match.data.playData.activePlayerIndex = this.getNextPlayerIndex(match);

        if (this.checkWinCondition(match)) {
            match.setTimeout(this.endMatch.bind(this, match), MATCH_END_DURATION);
        } else {
            const playerName = match.data.players[match.data.playData.activePlayerIndex].name;
            match.sendMessage(`Début du tour de ${playerName}`);
            this.trackingService.updateRounds(match);
            this.chatService.logPlayerTurnStart(match, playerName);
            match.setTimeout(this.startTurnWait.bind(this, match), TURN_START_DURATION);
        }
    }

    continueTurn(match: Match) {
        const curentPlayer = match.data.players[match.data.playData.activePlayerIndex];
        if (this.checkWinCondition(match)) {
            match.setTimeout(this.endMatch.bind(this, match), MATCH_END_DURATION);
        } else {
            if (match.data.state === MatchState.MovementAnimation) {
                this.itemService.checkAndPickupItem(match, curentPlayer);
            }
            if (match.data.state === MatchState.ItemWait) {
                this.startItemDrop(match, curentPlayer.id);
            } else if (this.canPlayerAct(match)) {
                this.continueTurnWait(match);
            } else {
                this.startNextTurn(match);
            }
        }
    }

    private canPlayerAct(match: Match): boolean {
        const hasPossibleActions = this.mapService.getActions(match.data).length > 0;
        const canUseAction = hasPossibleActions && match.data.playData.hasAction;
        const canMove = this.mapService.getPossibleMoves(match.data).length > 0;
        const canAct = canUseAction || canMove;
        const isConnected = match.data.players[match.data.playData.activePlayerIndex].isConnected;
        return canAct && isConnected;
    }

    private startItemDrop(match: Match, playerId: string) {
        this.setTimeLeft(match);
        match.sendUpdate();
        match.setTimeout(this.itemService.forceItemDrop.bind(this.itemService, match, playerId), DROP_ITEMS_DURATION);
    }

    private continueTurnWait(match: Match) {
        match.data.state = MatchState.TurnWait;
        match.sendUpdate();
        match.setTimeout(this.startNextTurn.bind(this, match), match.data.playData.timeLeft);
    }

    private checkWinCondition(match: Match): boolean {
        if (match.data.gameData.mapData.gameMode === GameMode.CTF) {
            return this.checkWinConditionCtf(match);
        } else {
            return this.checkWinConditionFfa(match);
        }
    }

    private checkWinConditionFfa(match: Match): boolean {
        const winner = match.data.players.find((p) => p.combatsWon >= MINIMUM_COMBATS_TO_WIN);
        if (winner) {
            match.data.state = MatchState.MatchEnd;
            match.sendMessage(`${winner.name} à gagné la partie`);
            this.trackingService.updateWinner(match, winner);
            this.chatService.logMatchWinner(match, winner.name);
        }
        return winner !== undefined;
    }

    private endMatch(match: Match) {
        match.data.state = MatchState.Statistics;
        this.trackingService.stopTrackingMatch(match);
        this.chatService.logEndMatch(match);

        match.sendUpdate();
        match.clearTimeout();
    }

    private checkWinConditionCtf(match: Match): boolean {
        let hasWon = false;
        const flagHolder = match.data.players.find((p) => p.items.includes(ItemType.Flag));
        if (flagHolder) {
            hasWon = flagHolder.position.x === flagHolder.spawnPoint.x && flagHolder.position.y === flagHolder.spawnPoint.y;
            if (hasWon) {
                this.trackingService.updateWinner(match, flagHolder);
                const winningTeam = flagHolder.team;
                match.data.state = MatchState.MatchEnd;
                match.sendMessage(`L'équipe ${winningTeam} remporte la partie !`);
            }
        }
        return hasWon;
    }

    private setTimeLeft(match: Match) {
        const elapsedTime = Math.abs(new Date().getTime() - match.lastTimeoutStart.getTime());
        match.data.playData.timeLeft = match.data.playData.timeLeft - elapsedTime;
    }

    private startTurnWait(match: Match) {
        match.data.state = MatchState.TurnWait;
        match.data.playData.hasAction = true;
        match.data.playData.movementLeft = match.data.players[match.data.playData.activePlayerIndex].speed;
        match.sendUpdate();
        match.setTimeout(this.startNextTurn.bind(this, match), TURN_WAIT_DURATION);
    }

    private executeAction(match: Match, playerId: string, position: Position) {
        const player = match.getPlayer(playerId);
        const targetPlayer = match.data.players.find((p) => p.position.x === position.x && p.position.y === position.y);
        if (targetPlayer) {
            this.setTimeLeft(match);
            this.combatService.startCombat(match, playerId, targetPlayer.id);
            this.chatService.logCombatStart(match, player.name, targetPlayer.name);
        } else {
            this.toggleBridgeTile(match, position);
            this.trackingService.updateToggledBridges(match, position);
            this.chatService.logBridgeToggled(match, player.name, position);
            this.continueTurn(match);
        }
    }

    private toggleBridgeTile(match: Match, position: Position) {
        const tile = match.data.gameData.mapData.tiles[position.x][position.y];
        if (tile === TileType.Bridge) {
            match.data.gameData.mapData.tiles[position.x][position.y] = TileType.BrokenBridge;
        } else if (tile === TileType.BrokenBridge) {
            match.data.gameData.mapData.tiles[position.x][position.y] = TileType.Bridge;
        }
    }

    private getNextPlayerIndex(match: Match): number {
        let nextIndex = (match.data.playData.activePlayerIndex + 1) % match.data.players.length;
        let steps = 0;
        while (steps <= match.data.players.length && !match.data.players[nextIndex].isConnected) {
            nextIndex = (nextIndex + 1) % match.data.players.length;
            steps++;
        }
        return nextIndex;
    }
}
