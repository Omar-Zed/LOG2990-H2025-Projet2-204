import { Match } from '@app/classes/match/match';
import { CombatGateway } from '@app/gateways/combat/combat.gateway';
import { PlayGateway } from '@app/gateways/play/play.gateway';
import { BotAction } from '@app/interfaces/bot-action.enum';
import { LobbyService } from '@app/services/lobby/lobby.service';
import { MapService } from '@app/services/map/map.service';
import { AVATAR_DATA, MAX_SELECTABLE_AVATAR_INDEX, MIN_SELECTABLE_AVATAR_INDEX } from '@common/consts/avatar-data.const';
import { RANDOM_THRESHOLD } from '@common/consts/match-data.const';
import { BONUS_STAT, DEFAULT_PLAYER_DATA, DEFAULT_STAT, MAX_ITEMS } from '@common/consts/player-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { MatchState, PlayerCombatData } from '@common/interfaces/match-data';
import { ShortestPath } from '@common/interfaces/movement';
import { Avatar, DiceType, PlayerData, PlayerType, Team } from '@common/interfaces/player-data';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import {
    BOT_CODE_LENGTH,
    BOT_COMBAT_MAX_DELAY,
    BOT_COMBAT_MIN_DELAY,
    BOT_ID_LETTERS,
    BOT_ITEM_MAX_DELAY,
    BOT_ITEM_MIN_DELAY,
    BOT_ITEM_PRIORITIES,
    BOT_TURN_MAX_DELAY,
    BOT_TURN_MIN_DELAY,
    BOT_TURN_PRIORITIES,
} from './bot.service.const';

@Injectable()
export class BotService {
    @Inject(forwardRef(() => LobbyService)) private lobbyService: LobbyService;
    @Inject(forwardRef(() => CombatGateway)) private combatGateway: CombatGateway;
    @Inject(forwardRef(() => PlayGateway)) private playGateway: PlayGateway;
    @Inject(MapService) private mapService: MapService;

    private readonly actionMap: Map<BotAction, (match: Match) => Position | null> = new Map([
        [BotAction.Attack, this.getBestAttack],
        [BotAction.MovePlayer, this.getBestMoveToPlayer],
        [BotAction.MoveItem, this.getBestMoveToItem],
        [BotAction.Bridge, this.getBestBridgeAction],
        [BotAction.MoveBridge, this.getBestMoveToBridge],
        [BotAction.MoveFlag, this.getBestMoveToFlag],
        [BotAction.MoveSpawnpoint, this.getBestMoveToSpawnpoint],
        [BotAction.AttackSpawnCamper, this.getBestAttackSpawnCamper],
        [BotAction.AttackFlagHolder, this.getBestAttackFlagHolder],
        [BotAction.MoveFlagHolder, this.getBestMoveToFlagHolder],
        [BotAction.CampSpawnpoint, this.getBestCampSpawnpoint],
    ]);

    onMatchUpdate(match: Match) {
        switch (match.data.state) {
            case MatchState.TurnWait:
                return this.onTurnWait(match);
            case MatchState.ItemWait:
                return this.onItemWait(match);
            case MatchState.CombatWait:
                return this.onCombatWait(match);
        }
    }

    getBotData(match: Match): PlayerData | null {
        let botData = null;
        const avatar = this.getBotAvatar(match);
        if (avatar) {
            const hasStrongAttack = Math.random() < RANDOM_THRESHOLD;
            const hasStrongSpeed = Math.random() < RANDOM_THRESHOLD;
            const id = this.getBotId();
            botData = {
                ...structuredClone(DEFAULT_PLAYER_DATA),
                id,
                isConnected: true,
                avatar,
                name: this.lobbyService.getUniqueName(match, id, AVATAR_DATA[avatar].name.toUpperCase()),
                attackDice: hasStrongAttack ? DiceType.D6 : DiceType.D4,
                defenseDice: hasStrongAttack ? DiceType.D4 : DiceType.D6,
                health: hasStrongSpeed ? DEFAULT_STAT : BONUS_STAT,
                speed: hasStrongSpeed ? BONUS_STAT : DEFAULT_STAT,
            };
        }
        return botData;
    }

    private onTurnWait(match: Match) {
        const activePlayer = match.data.players[match.data.playData.activePlayerIndex];
        if (activePlayer && activePlayer.type !== PlayerType.Player) {
            match.setBotTimeout(this.executeBotAction.bind(this, activePlayer, match), this.getRandomNumber(BOT_TURN_MIN_DELAY, BOT_TURN_MAX_DELAY));
        }
    }

    private getRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private getBotAction(action: BotAction, match: Match): Position | null {
        return this.actionMap.get(action).bind(this)(match);
    }

    private executeBotAction(player: PlayerData, match: Match): void {
        for (const botAction of BOT_TURN_PRIORITIES.get(match.data.gameData.mapData.gameMode).get(player.type)) {
            const targetPosition = this.getBotAction(botAction, match);
            if (targetPosition) {
                if (targetPosition.x === player.position.x && targetPosition.y === player.position.y) {
                    return this.playGateway.endTurn({ id: player.id } as Socket);
                } else {
                    this.playGateway.move({ id: player.id } as Socket, targetPosition);
                    return this.playGateway.action({ id: player.id } as Socket, targetPosition);
                }
            }
        }
        this.playGateway.endTurn({ id: player.id } as Socket);
    }

    private getBestMoveToBridge(match: Match): Position | null {
        const targetPositions = match.data.gameData.mapData.tiles
            .flatMap((row, x) => row.map((tile, y) => (tile === TileType.BrokenBridge ? { x, y } : null)))
            .filter((p) => p !== null)
            .map((p) => this.mapService.getSurroundingPositionsPlus(p));
        return this.getBestMove(targetPositions.flat(), match);
    }

    private getBestBridgeAction(match: Match): Position | null {
        const bridgeActions = this.mapService
            .getActions(match.data)
            .filter((pos) => match.data.gameData.mapData.tiles[pos.x][pos.y] === TileType.BrokenBridge);
        return this.getBestAction(bridgeActions, match);
    }

    private getBestMoveToPlayer(match: Match): Position | null {
        const targetPositions = this.getEnemyPlayers(match).map((enemy) => this.mapService.getSurroundingPositionsPlus(enemy.position));
        return this.getBestMove(targetPositions.flat(), match);
    }

    private getEnemyPlayers(match: Match): PlayerData[] {
        const activePlayer = match.data.players[match.data.playData.activePlayerIndex];
        return match.data.players.filter((p) => p.id !== activePlayer.id).filter((p) => p.team === Team.None || p.team !== activePlayer.team);
    }

    private getFlagHolder(match: Match): PlayerData | null {
        return this.getEnemyPlayers(match).find((enemy) => enemy.items.includes(ItemType.Flag));
    }

    private getBestMoveToFlag(match: Match): Position | null {
        return this.getBestMove(match.data.gameData.mapData.items.Flag, match);
    }

    private getBestMoveToSpawnpoint(match: Match): Position | null {
        let bestMoveToSpawnpoint = null;
        const player = match.data.players[match.data.playData.activePlayerIndex];
        if (player.items.includes(ItemType.Flag)) {
            bestMoveToSpawnpoint = this.getBestMove([player.spawnPoint], match);
            if (!bestMoveToSpawnpoint) {
                bestMoveToSpawnpoint = this.getBestMove(this.mapService.getSurroundingPositionsPlus(player.spawnPoint), match);
            }
        }
        return bestMoveToSpawnpoint;
    }

    private getBestCampSpawnpoint(match: Match): Position | null {
        let bestMoveToSpawnpoint = null;
        const flagHolder = this.getFlagHolder(match);
        if (flagHolder) {
            bestMoveToSpawnpoint = this.getBestMove([flagHolder.spawnPoint], match);
            if (!bestMoveToSpawnpoint) {
                bestMoveToSpawnpoint = this.getBestMove(this.mapService.getSurroundingPositionsPlus(flagHolder.spawnPoint), match);
            }
        }
        return bestMoveToSpawnpoint;
    }

    private getBestMoveToFlagHolder(match: Match): Position | null {
        let bestMoveToSpawnpoint = null;
        const flagHolder = this.getFlagHolder(match);
        if (flagHolder) {
            bestMoveToSpawnpoint = this.getBestMove(this.mapService.getSurroundingPositionsPlus(flagHolder.position), match);
        }
        return bestMoveToSpawnpoint;
    }

    private getBestMoveToItem(match: Match): Position | null {
        let bestMoveToItem = null;
        if (match.data.players[match.data.playData.activePlayerIndex].items.length < 2) {
            const targetPositions = Object.values(ItemType)
                .filter((i) => i !== ItemType.Spawn && i !== ItemType.Flag)
                .map((i) => match.data.gameData.mapData.items[i]);
            bestMoveToItem = this.getBestMove(targetPositions.flat(), match);
        }
        return bestMoveToItem;
    }

    private getBestMove(targetPositions: Position[], match: Match): Position | null {
        const selfPosition = match.data.players[match.data.playData.activePlayerIndex].position;
        if (targetPositions.some((p) => p.x === selfPosition.x && p.y === selfPosition.y)) {
            return selfPosition;
        }
        const path = this.getBestPath(targetPositions, match);
        if (path) {
            const possibleMoves = this.mapService.getPossibleMoves(match.data);
            for (let i = path.path.length - 1; i >= 0; i--) {
                const pos = path.path[i];
                if (possibleMoves.some((move) => move.x === pos.x && move.y === pos.y)) {
                    return pos;
                }
            }
            return selfPosition;
        }
        return null;
    }

    private getBestPath(targetPositions: Position[], match: Match): ShortestPath | null {
        let bestPath = null;
        const paths = targetPositions.map((p) => this.mapService.getShortestPath(match.data, p)).filter((p) => p.moveCost < Infinity);
        if (paths.length > 0) {
            bestPath = paths.reduce((best, current) => (current.moveCost < best.moveCost ? current : best));
        }
        return bestPath;
    }

    private getBestAttack(match: Match): Position | null {
        const enemyPlayers = this.getEnemyPlayers(match);
        const attackActions = this.mapService
            .getActions(match.data)
            .filter((pos) => enemyPlayers.some((enemy) => enemy.position.x === pos.x && enemy.position.y === pos.y));
        return this.getBestAction(attackActions, match);
    }

    private getBestAction(possibleActions: Position[], match: Match): Position | null {
        let bestAttack = null;
        if (possibleActions.length > 0) {
            if (match.data.playData.hasAction) {
                bestAttack = possibleActions[0];
            } else {
                bestAttack = match.data.players[match.data.playData.activePlayerIndex].position;
            }
        }
        return bestAttack;
    }

    private getBestAttackSpawnCamper(match: Match): Position | null {
        let bestAttackSpawnCamper = null;
        const activePlayer = match.data.players[match.data.playData.activePlayerIndex];
        if (activePlayer.items.includes(ItemType.Flag)) {
            const attackActions = this.mapService
                .getActions(match.data)
                .filter((pos) => activePlayer.spawnPoint.x === pos.x && activePlayer.spawnPoint.y === pos.y);
            bestAttackSpawnCamper = this.getBestAction(attackActions, match);
        }
        return bestAttackSpawnCamper;
    }

    private getBestAttackFlagHolder(match: Match): Position | null {
        let bestAttackFlagHolder = null;
        const flagHolder = this.getFlagHolder(match);
        if (flagHolder) {
            const attackActions = this.mapService
                .getActions(match.data)
                .filter((attack) => flagHolder.position.x === attack.x && flagHolder.position.y === attack.y);
            bestAttackFlagHolder = this.getBestAction(attackActions, match);
        }
        return bestAttackFlagHolder;
    }

    private onItemWait(match: Match) {
        const activePlayer = match.data.players[match.data.playData.activePlayerIndex];
        if (activePlayer && activePlayer.type !== PlayerType.Player) {
            match.setBotTimeout(this.itemAction.bind(this, activePlayer), this.getRandomNumber(BOT_ITEM_MIN_DELAY, BOT_ITEM_MAX_DELAY));
        }
    }

    private itemAction(player: PlayerData): void {
        if (player.items.length > MAX_ITEMS) {
            const priorities = BOT_ITEM_PRIORITIES.get(player.type);
            const itemToDrop = player.items.reduce((lowest, current) => {
                return priorities.indexOf(current) > priorities.indexOf(lowest) ? current : lowest;
            }, player.items[0]);
            this.playGateway.dropItem({ id: player.id } as Socket, itemToDrop);
        }
    }

    private onCombatWait(match: Match) {
        const playerCombatDataIndex = match.data.combatData.isSecondPlayerTurn ? 1 : 0;
        const playerCombatData = match.data.combatData.playersCombatData[playerCombatDataIndex];
        const activePlayer = match.data.players[playerCombatData.playerIndex];
        if (activePlayer && activePlayer.type !== PlayerType.Player) {
            const delay = this.getRandomNumber(BOT_COMBAT_MIN_DELAY, BOT_COMBAT_MAX_DELAY);
            match.setBotTimeout(this.botCombatAction.bind(this, activePlayer, playerCombatData), delay);
        }
    }

    private botCombatAction(player: PlayerData, playerCombatData: PlayerCombatData) {
        const isDefensiveBot = player.type === PlayerType.BotDefensive;
        const isWounded = playerCombatData.currentHealth < player.health;
        const hasEscapesLeft = playerCombatData.currentEscapes > 0;
        if (isDefensiveBot && isWounded && hasEscapesLeft) {
            this.combatGateway.escape({ id: player.id } as Socket);
        } else {
            this.combatGateway.attack({ id: player.id } as Socket);
        }
    }

    private getBotAvatar(match: Match): Avatar | null {
        let botAvatar = null;
        const lockedAvatars = match.data.players.map((p) => p.avatar);
        const unlockedAvatars = Object.values(Avatar)
            .slice(MIN_SELECTABLE_AVATAR_INDEX, MAX_SELECTABLE_AVATAR_INDEX)
            .filter((avatar) => !lockedAvatars.includes(avatar));
        if (unlockedAvatars.length > 0) {
            const randomIndex = Math.floor(Math.random() * (unlockedAvatars.length - 1)) + 1;
            botAvatar = unlockedAvatars[randomIndex];
        }
        return botAvatar;
    }

    private getBotId(): string {
        let result = '';
        for (let i = 0; i < BOT_CODE_LENGTH; i++) {
            const randomIndex = Math.floor(Math.random() * BOT_ID_LETTERS.length);
            result += BOT_ID_LETTERS[randomIndex];
        }
        return result;
    }
}
